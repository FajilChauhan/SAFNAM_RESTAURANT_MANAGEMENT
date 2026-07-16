import { ERROR_CODES } from "../../constants/errorCodes.js";
import { BaseService } from "../../lib/BaseService.js";
import type { QueryOptions } from "../../types/pagination.types.js";
import { ApiError } from "../../utils/ApiError.js";
import type { CreateTableDto, UpdateTableDto } from "./dto/table.dto.js";
import { TableRepository } from "./table.repository.js";

export class TableService extends BaseService {
  constructor(private readonly tableRepository: TableRepository) {
    super();
  }

  async create(dto: CreateTableDto) {
    const existingTable = await this.tableRepository.findByTableNumber(dto.tableNumber);

    if (existingTable) {
      throw new ApiError(409, "Table number already exists", ERROR_CODES.RESOURCE_CONFLICT);
    }

    return this.tableRepository.create(dto);
  }

  list(options: QueryOptions) {
    return this.tableRepository.list(options);
  }

  async update(id: string, dto: UpdateTableDto) {
    const table = await this.tableRepository.findById(id);

    if (!table) {
      throw new ApiError(404, "Table not found", ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (dto.tableNumber && dto.tableNumber !== table.tableNumber) {
      const existingTable = await this.tableRepository.findByTableNumber(dto.tableNumber);

      if (existingTable) {
        throw new ApiError(409, "Table number already exists", ERROR_CODES.RESOURCE_CONFLICT);
      }
    }

    return this.tableRepository.update(id, dto);
  }

  async delete(id: string) {
    const table = await this.tableRepository.findById(id);
    this.ensureExists(table, "Table not found");

    await this.tableRepository.delete(id);
  }
}

export const tableService = new TableService(new TableRepository());
