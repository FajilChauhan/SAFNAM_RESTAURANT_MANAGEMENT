import { BaseController } from "../../lib/BaseController.js";
import { getUploadedFileUrl } from "../../services/upload/upload.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uuidSchema } from "../../utils/validator.js";
import { adminService } from "./admin.service.js";
import {
  adminListQuerySchema,
  createEmployeeSchema,
  createOfferSchema,
  offerListQuerySchema,
  updateEmployeeSchema,
  updateOfferSchema,
  updateUserStatusSchema,
  updateRolePermissionsSchema,
} from "./admin.validator.js";
import { auditService } from "../../services/audit/audit.service.js";

class AdminController extends BaseController {
  listEmployees = asyncHandler(async (req, res) => {
    const result = await adminService.listEmployees(adminListQuerySchema.parse(req.query));
    this.ok(res, "Employees fetched successfully", { employees: result.data }, result.meta);
  });

  createEmployee = asyncHandler(async (req, res) => {
    const employee = await adminService.createEmployee(createEmployeeSchema.parse(req.body), req.user!.id);
    void auditService.record({ actor: req.user!, action: "Created Employee", module: "Employees", entityType: "User", entityId: employee.id, entityName: employee.fullName, ipAddress: req.ip, userAgent: req.get("user-agent") });
    this.created(res, "Employee created successfully", { employee });
  });

  updateEmployee = asyncHandler(async (req, res) => {
    const employee = await adminService.updateEmployee(uuidSchema.parse(req.params.id), updateEmployeeSchema.parse(req.body), req.user!.id);
    void auditService.record({ actor: req.user!, action: "Updated Employee", module: "Employees", entityType: "User", entityId: employee.id, entityName: employee.fullName, ipAddress: req.ip, userAgent: req.get("user-agent") });
    this.ok(res, "Employee updated successfully", { employee });
  });

  updateEmployeeStatus = asyncHandler(async (req, res) => {
    const { status } = updateUserStatusSchema.parse(req.body);
    const employee = await adminService.setEmployeeStatus(uuidSchema.parse(req.params.id), status, req.user!.id);
    void auditService.record({ actor: req.user!, action: "Changed Employee Status", module: "Employees", entityType: "User", entityId: employee.id, entityName: employee.fullName, metadata: { status }, ipAddress: req.ip, userAgent: req.get("user-agent") });
    this.ok(res, "Employee status updated successfully", { employee });
  });

  deleteEmployee = asyncHandler(async (req, res) => {
    const employee = await adminService.deleteEmployee(uuidSchema.parse(req.params.id), req.user!.id);
    void auditService.record({ actor: req.user!, action: "Deleted Employee", module: "Employees", entityType: "User", entityId: employee.id, entityName: employee.fullName, ipAddress: req.ip, userAgent: req.get("user-agent") });
    this.ok(res, "Employee deleted successfully", { employee });
  });

  listCustomers = asyncHandler(async (req, res) => {
    const result = await adminService.listCustomers(adminListQuerySchema.parse(req.query));
    this.ok(res, "Customers fetched successfully", { customers: result.data }, result.meta);
  });

  getCustomer = asyncHandler(async (req, res) => {
    const customer = await adminService.getCustomer(uuidSchema.parse(req.params.id));
    this.ok(res, "Customer fetched successfully", { customer });
  });

  updateCustomerStatus = asyncHandler(async (req, res) => {
    const { status } = updateUserStatusSchema.parse(req.body);
    const customer = await adminService.setCustomerStatus(uuidSchema.parse(req.params.id), status, req.user!.id);
    void auditService.record({ actor: req.user!, action: "Changed Customer Status", module: "Customers", entityType: "User", entityId: customer.id, entityName: customer.fullName, metadata: { status }, ipAddress: req.ip, userAgent: req.get("user-agent") });
    this.ok(res, "Customer status updated successfully", { customer });
  });

  listOffers = asyncHandler(async (req, res) => {
    const result = await adminService.listOffers(offerListQuerySchema.parse(req.query));
    this.ok(res, "Offers fetched successfully", { offers: result.data }, result.meta);
  });

  createOffer = asyncHandler(async (req, res) => {
    const offer = await adminService.createOffer(createOfferSchema.parse({
      ...req.body,
      imageUrl: getUploadedFileUrl(req.file) ?? req.body.imageUrl,
    }), req.user!.id);
    void auditService.record({ actor: req.user!, action: "Created Offer", module: "Offers", entityType: "Offer", entityId: offer.id, entityName: offer.title, ipAddress: req.ip, userAgent: req.get("user-agent") });
    this.created(res, "Offer created successfully", { offer });
  });

  updateOffer = asyncHandler(async (req, res) => {
    const offer = await adminService.updateOffer(uuidSchema.parse(req.params.id), updateOfferSchema.parse({
      ...req.body,
      imageUrl: getUploadedFileUrl(req.file) ?? req.body.imageUrl,
    }), req.user!.id);
    void auditService.record({ actor: req.user!, action: "Updated Offer", module: "Offers", entityType: "Offer", entityId: offer.id, entityName: offer.title, ipAddress: req.ip, userAgent: req.get("user-agent") });
    this.ok(res, "Offer updated successfully", { offer });
  });

  deleteOffer = asyncHandler(async (req, res) => {
    const offer = await adminService.deleteOffer(uuidSchema.parse(req.params.id), req.user!.id);
    void auditService.record({ actor: req.user!, action: "Deleted Offer", module: "Offers", entityType: "Offer", entityId: offer.id, entityName: offer.title, ipAddress: req.ip, userAgent: req.get("user-agent") });
    this.ok(res, "Offer deleted successfully", { offer });
  });

  roles = asyncHandler(async (_req, res) => {
    this.ok(res, "Roles fetched successfully", { roles: await adminService.roles() });
  });

  permissions = asyncHandler(async (_req, res) => {
    this.ok(res, "Permissions fetched successfully", { permissions: adminService.permissions() });
  });

  updateRolePermissions = asyncHandler(async (req, res) => {
    const { role, permissions } = updateRolePermissionsSchema.parse(req.body);
    const updatedPermissions = await adminService.setRolePermissions(role, permissions as never, req.user!.id);
    void auditService.record({ actor: req.user!, action: "Updated Role Permissions", module: "Permissions", entityType: "Role", entityId: role, entityName: role, metadata: { permissions }, ipAddress: req.ip, userAgent: req.get("user-agent") });
    this.ok(res, "Role permissions updated successfully", { role, permissions: updatedPermissions });
  });

  auditLogs = asyncHandler(async (req, res) => {
    const audit = await adminService.auditLogs(adminListQuerySchema.parse(req.query));
    this.ok(res, "Audit activity fetched successfully", { audit });
  });

  customerStats = asyncHandler(async (_req, res) => {
    const stats = await adminService.getCustomerStats();
    this.ok(res, "Customer statistics fetched successfully", stats);
  });

  health = asyncHandler(async (_req, res) => {
    const health = await adminService.health();
    this.ok(res, "Admin health fetched successfully", { health });
  });
}

export const adminController = new AdminController();
