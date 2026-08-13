import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Search, Plus, X, Eye, EyeOff, User,
  Mail, Phone, Shield, Lock,
  AlertCircle, CheckCircle, Loader2
} from 'lucide-react'
import { operationsApi } from '../../../api/operations.api'
import { cn } from '../../../utils/cn'

// === TYPES ===
interface Employee {
  id: string
  fullName: string
  email: string
  phoneNumber?: string
  role: string
  status?: string
  lastLoginAt?: string
  createdAt?: string
}

// === ZOD SCHEMA ===
const employeeSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phoneNumber: z.string().trim().min(7, 'Phone number must be at least 7 characters').max(20, 'Phone number cannot exceed 20 characters'),
  role: z.enum(['MANAGER', 'RECEPTION', 'KITCHEN', 'ADMIN'], {
    required_error: 'Please select a role',
  }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: "Passwords don't match", path: ['confirmPassword'] }
)

type EmployeeFormData = z.infer<typeof employeeSchema>

// === ROLE CONFIG ===
const ROLES = [
  {
    value: 'MANAGER',
    label: 'Manager',
    description: 'Manages daily operations',
    color: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  {
    value: 'RECEPTION',
    label: 'Reception',
    description: 'Handles bookings & check-ins',
    color: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  {
    value: 'KITCHEN',
    label: 'Kitchen Staff',
    description: 'Manages kitchen orders',
    color: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  {
    value: 'CUSTOMER',
    label: 'Customer',
    description: 'Restaurant customer',
    color: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-500',
  },
  {
    value: 'ADMIN',
    label: 'Admin',
    description: 'Full system access',
    color: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
]

const getRoleConfig = (role: string) =>
  ROLES.find((r) => r.value === role) ?? ROLES[0]

// === COMPONENT ===
const EmployeesPage = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  // === FETCH EMPLOYEES ===
  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await operationsApi.getEmployees()
      // API returns { data: { employees: [...] }, meta: {...} }
      const employeesList = res.data?.data?.employees ?? []
      return Array.isArray(employeesList) ? employeesList : []
    },
  })

  // === CREATE EMPLOYEE MUTATION ===
  const createMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const res = await operationsApi.createEmployee({
        fullName: data.fullName,
        email: data.email || undefined,
        phoneNumber: data.phoneNumber,
        role: data.role,
        password: data.password,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setShowAddModal(false)
      setSuccessMsg('Employee created successfully!')
      reset()
      setTimeout(() => setSuccessMsg(''), 3000)
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      setErrorMsg(err.response?.data?.message ?? 'Failed to create employee')
      setTimeout(() => setErrorMsg(''), 4000)
    },
  })

  // === UPDATE EMPLOYEE STATUS MUTATION ===
  const updateStatusMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const employee = employees.find(e => e.id === employeeId)
      const newStatus = employee?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      const res = await operationsApi.updateEmployee(employeeId, { status: newStatus })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setSuccessMsg('Employee status updated successfully!')
      setTimeout(() => setSuccessMsg(''), 3000)
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      setErrorMsg(err.response?.data?.message ?? 'Failed to update employee')
      setTimeout(() => setErrorMsg(''), 4000)
    },
  })

  // === FORM ===
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  })

  const selectedRole = watch('role')

  const onSubmit = (data: EmployeeFormData) => {
    setErrorMsg('')
    createMutation.mutate(data)
  }

  // === FILTER ===
  const filtered = employees.filter((emp) => {
    const matchSearch =
      emp.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'ALL' || emp.role === roleFilter
    return matchSearch && matchRole
  })

  // === STATS ===
  const stats = {
    total: employees.length,
    managers: employees.filter((e) => e.role === 'MANAGER').length,
    reception: employees.filter((e) => e.role === 'RECEPTION').length,
    kitchen: employees.filter((e) => e.role === 'KITCHEN').length,
  }

  return (
    <div className="space-y-6">

      {/* SUCCESS TOAST */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-2xl shadow-lg"
          >
            <CheckCircle size={18} />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ERROR TOAST */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-red-600 text-white rounded-2xl shadow-lg"
          >
            <AlertCircle size={18} />
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Create and manage SAFNAM staff accounts
          </p>
        </div>
        <button
          onClick={() => {
            reset()
            setErrorMsg('')
            setShowAddModal(true)
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-emerald-600/20"
        >
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: stats.total, color: 'bg-gray-50 border-gray-200', textColor: 'text-gray-900', sub: 'All employees' },
          { label: 'Managers', value: stats.managers, color: 'bg-emerald-50 border-emerald-100', textColor: 'text-emerald-700', sub: 'Operations' },
          { label: 'Reception', value: stats.reception, color: 'bg-blue-50 border-blue-100', textColor: 'text-blue-700', sub: 'Front desk' },
          { label: 'Kitchen Staff', value: stats.kitchen, color: 'bg-amber-50 border-amber-100', textColor: 'text-amber-700', sub: 'Kitchen team' },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-2xl p-4 border', s.color)}>
            <p className={cn('text-3xl font-bold', s.textColor)}>{s.value}</p>
            <p className="text-gray-700 font-medium text-sm mt-1">{s.label}</p>
            <p className="text-gray-400 text-xs mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* SEARCH + FILTER + TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>

          {/* Role filter */}
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'MANAGER', 'RECEPTION', 'KITCHEN', 'ADMIN'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                  roleFilter === role
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                )}
              >
                {role === 'ALL' ? 'All Roles' : role}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <User size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No employees found</p>
            <p className="text-gray-300 text-sm mt-1">
              {search ? 'Try a different search term' : 'Click "Add Employee" to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['NAME', 'CONTACT', 'ROLE', 'STATUS', 'LAST LOGIN', 'ACTIONS'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-gray-400 tracking-wider pb-3 uppercase px-2 first:px-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors group">
                    {/* Name */}
                    <td className="py-4 px-2 first:px-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                          <span className="text-emerald-700 font-bold text-sm">
                            {emp.fullName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{emp.fullName}</p>
                          <p className="text-gray-400 text-xs">
                            #{emp.id?.slice(-6).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-2">
                      <p className="text-gray-700 text-sm">{emp.phoneNumber ?? '—'}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{emp.email}</p>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium',
                          getRoleConfig(emp.role).color
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full', getRoleConfig(emp.role).dot)} />
                        {emp.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-2">
                      <span
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-full font-medium',
                          emp.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        {emp.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="py-4 px-2">
                      <p className="text-gray-500 text-sm">
                        {emp.lastLoginAt
                          ? new Date(emp.lastLoginAt).toLocaleString()
                          : 'Never'}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setSelectedEmployee(emp)
                            setShowViewModal(true)
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg transition-all cursor-pointer hover:shadow-md">
                          View
                        </button>
                        <button 
                          onClick={() => {
                            setEditingEmployee(emp)
                            setShowEditModal(true)
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:border-emerald-300 rounded-lg transition-all bg-emerald-50 hover:bg-emerald-100 cursor-pointer hover:shadow-md">
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEmployee(emp)
                            updateStatusMutation.mutate(emp.id)
                          }}
                          disabled={updateStatusMutation.isPending}
                          className={cn(
                            'px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
                            emp.status === 'ACTIVE'
                              ? 'text-red-500 border border-red-200 hover:bg-red-50'
                              : 'text-green-600 border border-green-200 hover:bg-green-50'
                          )}
                        >
                          {emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD EMPLOYEE MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Add Employee</h2>
                    <p className="text-gray-400 text-sm mt-0.5">
                      Create a new staff account for SAFNAM
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all text-gray-500"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

                  {/* Error in form */}
                  {errorMsg && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                      <AlertCircle size={16} />
                      {errorMsg}
                    </div>
                  )}

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('fullName')}
                        type="text"
                        placeholder="Enter full name"
                        className={cn(
                          'w-full h-11 pl-10 pr-4 rounded-xl bg-gray-50 border text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 transition-all',
                          errors.fullName
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
                            : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10'
                        )}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="employee@safnam.com"
                        className={cn(
                          'w-full h-11 pl-10 pr-4 rounded-xl bg-gray-50 border text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 transition-all',
                          errors.email
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
                            : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10'
                        )}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('phoneNumber')}
                        type="tel"
                        placeholder="7-20 digit phone number"
                        maxLength={20}
                        className={cn(
                          'w-full h-11 pl-10 pr-4 rounded-xl bg-gray-50 border text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 transition-all',
                          errors.phoneNumber
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
                            : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10'
                        )}
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.phoneNumber.message}
                      </p>
                    )}
                  </div>

                  {/* Role Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {ROLES.filter(r => r.value !== 'CUSTOMER').map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() =>
                            setValue('role', role.value as EmployeeFormData['role'], {
                              shouldValidate: true,
                            })
                          }
                          className={cn(
                            'flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all',
                            selectedRole === role.value
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                          )}
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                              selectedRole === role.value ? role.color : 'bg-gray-100 text-gray-400'
                            )}
                          >
                            <Shield size={14} />
                          </div>
                          <div className="flex-1">
                            <p
                              className={cn(
                                'font-semibold text-sm',
                                selectedRole === role.value ? 'text-gray-900' : 'text-gray-600'
                              )}
                            >
                              {role.label}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{role.description}</p>
                          </div>
                          {selectedRole === role.value && (
                            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                    {errors.role && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.role.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        autoComplete="new-password"
                        className={cn(
                          'w-full h-11 pl-10 pr-10 rounded-xl bg-gray-50 border text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 transition-all',
                          errors.password
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
                            : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10'
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('confirmPassword')}
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        className={cn(
                          'w-full h-11 pl-10 pr-10 rounded-xl bg-gray-50 border text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 transition-all',
                          errors.confirmPassword
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
                            : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10'
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className={cn(
                        'flex-1 h-11 rounded-xl font-semibold text-white text-sm transition-all flex items-center justify-center gap-2',
                        createMutation.isPending
                          ? 'bg-emerald-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      )}
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          Create Employee
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* VIEW EMPLOYEE MODAL */}
      <AnimatePresence>
        {showViewModal && selectedEmployee && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowViewModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Employee Details</h2>
                    <p className="text-gray-400 text-sm mt-0.5">View staff information</p>
                  </div>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all text-gray-500"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                    <p className="text-gray-900 font-semibold">{selectedEmployee.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                    <p className="text-gray-900">{selectedEmployee.email || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
                    <p className="text-gray-900">{selectedEmployee.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Role</label>
                    <span className={cn('inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium', getRoleConfig(selectedEmployee.role).color)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', getRoleConfig(selectedEmployee.role).dot)} />
                      {selectedEmployee.role}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                    <span className={cn('inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium', selectedEmployee.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {selectedEmployee.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Created</label>
                    <p className="text-gray-900">{selectedEmployee.createdAt ? new Date(selectedEmployee.createdAt).toLocaleString() : '—'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Last Login</label>
                    <p className="text-gray-900">{selectedEmployee.lastLoginAt ? new Date(selectedEmployee.lastLoginAt).toLocaleString() : 'Never'}</p>
                  </div>
                </div>
                <div className="flex gap-3 p-6 border-t border-gray-100">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* EDIT EMPLOYEE MODAL */}
      <AnimatePresence>
        {showEditModal && editingEmployee && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Edit Employee</h2>
                    <p className="text-gray-400 text-sm mt-0.5">Update staff information</p>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all text-gray-500"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={editingEmployee.fullName}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, fullName: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={editingEmployee.email || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={editingEmployee.phoneNumber || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, phoneNumber: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingEmployee({ ...editingEmployee, status: 'ACTIVE' })}
                        className={cn(
                          'flex-1 h-10 rounded-lg font-medium text-sm transition-all',
                          editingEmployee.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300'
                        )}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingEmployee({ ...editingEmployee, status: 'INACTIVE' })}
                        className={cn(
                          'flex-1 h-10 rounded-lg font-medium text-sm transition-all',
                          editingEmployee.status === 'INACTIVE'
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300'
                        )}
                      >
                        Inactive
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 p-6 border-t border-gray-100">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editingEmployee) {
                        // TODO: Call update API
                        setShowEditModal(false)
                        setSuccessMsg('Employee updated successfully!')
                        setTimeout(() => setSuccessMsg(''), 3000)
                      }
                    }}
                    className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all text-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default EmployeesPage
