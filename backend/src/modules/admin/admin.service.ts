import { UserRole, UserStatus } from "@prisma/client";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { BaseService } from "../../lib/BaseService.js";
import { ApiError } from "../../utils/ApiError.js";
import { hashPassword } from "../../utils/password.js";
import { OPERATION_PERMISSIONS, ROLE_PERMISSION_MAP } from "../operations/constants/operationPermissions.js";
import type { OperationPermission } from "../operations/constants/operationPermissions.js";
import { permissionService } from "../operations/services/permission.service.js";
import { AdminRepository } from "./admin.repository.js";
import type {
  AdminListQueryDto,
  CreateEmployeeDto,
  CreateOfferDto,
  OfferListQueryDto,
  UpdateEmployeeDto,
  UpdateOfferDto,
} from "./admin.validator.js";

export class AdminService extends BaseService {
  constructor(private readonly adminRepository: AdminRepository) {
    super();
  }

  listEmployees(query: AdminListQueryDto) {
    return this.adminRepository.listEmployees(query);
  }

  async createEmployee(dto: CreateEmployeeDto, adminId: string) {
    await this.ensureUserUnique(dto.phoneNumber, dto.email);
    const passwordHash = await hashPassword(dto.password);
    return this.adminRepository.createEmployee({ ...dto, passwordHash, createdBy: adminId });
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto, adminId: string) {
    const employee = this.ensureExists(await this.adminRepository.findUserById(id), "Employee not found");
    this.ensure(employee.role !== UserRole.CUSTOMER, "Customer accounts cannot be edited from employee management");
    if (dto.phoneNumber && dto.phoneNumber !== employee.phoneNumber) {
      const existing = await this.adminRepository.findUserByPhone(dto.phoneNumber);
      if (existing && existing.id !== id) throw new ApiError(409, "Phone number already exists", ERROR_CODES.RESOURCE_CONFLICT);
    }
    if (dto.email && dto.email !== employee.email) {
      const existing = await this.adminRepository.findUserByEmail(dto.email);
      if (existing && existing.id !== id) throw new ApiError(409, "Email already exists", ERROR_CODES.RESOURCE_CONFLICT);
    }
    const { password, ...rest } = dto;
    const passwordHash = password ? await hashPassword(password) : undefined;
    return this.adminRepository.updateEmployee(id, { ...rest, passwordHash, updatedBy: adminId });
  }

  async setEmployeeStatus(id: string, status: UserStatus, adminId: string) {
    return this.updateEmployee(id, { status }, adminId);
  }

  async deleteEmployee(id: string, adminId: string) {
    const employee = this.ensureExists(await this.adminRepository.findUserById(id), "Employee not found");
    this.ensure(employee.role !== UserRole.CUSTOMER, "Customer accounts cannot be deleted from employee management");
    return this.adminRepository.softDeleteUser(id, adminId);
  }

  listCustomers(query: AdminListQueryDto) {
    return this.adminRepository.listCustomers(query);
  }

  async getCustomerStats() {
    return this.adminRepository.getCustomerStats();
  }

  async getCustomer(id: string) {
    return this.ensureExists(await this.adminRepository.getCustomer(id), "Customer not found");
  }

  async setCustomerStatus(id: string, status: UserStatus, adminId: string) {
    const customer = this.ensureExists(await this.adminRepository.getCustomer(id), "Customer not found");
    this.ensure(customer.status !== status, "Customer already has this status");
    return this.adminRepository.updateEmployee(id, { status, updatedBy: adminId });
  }

  listOffers(query: OfferListQueryDto) {
    return this.adminRepository.listOffers(query);
  }

  createOffer(dto: CreateOfferDto, adminId: string) {
    return this.adminRepository.createOffer({ ...dto, createdBy: adminId });
  }

  async updateOffer(id: string, dto: UpdateOfferDto, adminId: string) {
    this.ensureExists(await this.adminRepository.findOfferById(id), "Offer not found");
    return this.adminRepository.updateOffer(id, { ...dto, updatedBy: adminId });
  }

  async deleteOffer(id: string, adminId: string) {
    this.ensureExists(await this.adminRepository.findOfferById(id), "Offer not found");
    return this.adminRepository.softDeleteOffer(id, adminId);
  }

  async roles() {
    const permissionsByRole = await Promise.all(
      Object.values(UserRole).map(async (role) => ({
        role,
        permissions: await permissionService.permissionsForRole(role),
      })),
    );

    const permissionLookup = new Map(permissionsByRole.map((item) => [item.role, item.permissions]));

    return Object.values(UserRole).map((role) => ({
      role,
      assignableToEmployee: role !== UserRole.CUSTOMER,
      permissions: permissionLookup.get(role) ?? ROLE_PERMISSION_MAP[role],
    }));
  }

  permissions() {
    return Object.values(OPERATION_PERMISSIONS).map((permission) => ({ permission }));
  }

  async setRolePermissions(role: UserRole, permissions: OperationPermission[], adminId: string) {
    this.ensure(role !== UserRole.ADMIN, "ADMIN permissions cannot be reduced from the admin panel");
    const known = new Set(Object.values(OPERATION_PERMISSIONS));
    const unknown = permissions.filter((permission) => !known.has(permission));
    this.ensure(unknown.length === 0, `Unknown permissions: ${unknown.join(", ")}`);
    return permissionService.setRolePermissions(role, permissions, adminId);
  }

  async health() {
    const [system, database] = await Promise.all([this.adminRepository.systemHealth(), this.adminRepository.databaseHealth()]);
    return { system, database };
  }

  auditLogs(query: AdminListQueryDto) {
    return this.adminRepository.auditSummary(query);
  }

  private async ensureUserUnique(phoneNumber: string, email?: string) {
    if (await this.adminRepository.findUserByPhone(phoneNumber)) {
      throw new ApiError(409, "Phone number already exists", ERROR_CODES.RESOURCE_CONFLICT);
    }
    if (email && (await this.adminRepository.findUserByEmail(email))) {
      throw new ApiError(409, "Email already exists", ERROR_CODES.RESOURCE_CONFLICT);
    }
  }
}

export const adminService = new AdminService(new AdminRepository());
