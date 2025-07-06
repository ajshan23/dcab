import { useState, useMemo, useRef } from 'react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import DataTable from '@/components/shared/DataTable'
import { HiOutlineEye, HiOutlinePencil } from 'react-icons/hi'
import { FiUser } from 'react-icons/fi'
import useThemeClass from '@/utils/hooks/useThemeClass'
import { useNavigate } from 'react-router-dom'
import type { DataTableResetHandle, ColumnDef } from '@/components/shared/DataTable'
import { useQuery } from '@tanstack/react-query'
import debounce from 'lodash/debounce'
import Input from '@/components/ui/Input'
import { apiGetUsers } from '@/services/UserService'
import type { ApiResponse } from '@/@types'

interface User {
    id: number
    username: string
    role: string
    createdAt: string
    updatedAt: string
}

const userRoleColor = {
    super_admin: {
        label: 'Super Admin',
        dotClass: 'bg-purple-500',
        textClass: 'text-purple-500',
    },
    admin: {
        label: 'Admin',
        dotClass: 'bg-blue-500',
        textClass: 'text-blue-500',
    },
    user: {
        label: 'User',
        dotClass: 'bg-gray-500',
        textClass: 'text-gray-500',
    }
}

const UserTable = () => {
    const tableRef = useRef<DataTableResetHandle>(null)
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
    })

    const { data, isLoading, error } = useQuery<ApiResponse<{ 
        data: User[]
        total: number 
    }>>({
        queryKey: ['users', pagination, searchTerm],
        queryFn: () => apiGetUsers({
            page: pagination.page,
            limit: pagination.limit,
            search: searchTerm
        }),
    })

    const debouncedSearch = useMemo(
        () => debounce((value: string) => {
            setSearchTerm(value)
            setPagination(prev => ({ ...prev, page: 1 }))
        }, 500),
        []
    )

    const columns: ColumnDef<User>[] = useMemo(() => [
        {
            header: 'Username',
            accessorKey: 'username',
            cell: (props) => (
                <div className="flex items-center">
                    <Avatar icon={<FiUser />} alt={props.row.original.username} />
                    <span className="ml-2 font-semibold">{props.row.original.username}</span>
                </div>
            ),
        },
        {
            header: 'Role',
            accessorKey: 'role',
            cell: (props) => {
                const role = props.row.original.role as keyof typeof userRoleColor
                const roleInfo = userRoleColor[role] || userRoleColor.user
                return (
                    <div className="flex items-center gap-2">
                        <Badge className={roleInfo.dotClass} />
                        <span className={`font-semibold ${roleInfo.textClass}`}>
                            {roleInfo.label}
                        </span>
                    </div>
                )
            },
        },
        {
            header: 'Created At',
            accessorKey: 'createdAt',
            cell: (props) => (
                <span>{new Date(props.row.original.createdAt).toLocaleDateString()}</span>
            ),
        },
        {
            header: 'Actions',
            id: 'action',
            cell: (props) => {
                const { textTheme } = useThemeClass()
                return (
                    <div className="flex justify-end text-lg">
                        <span
                            className={`cursor-pointer p-2 hover:${textTheme}`}
                            onClick={() => navigate(`/users/view/${props.row.original._id}`)}
                        >
                            <HiOutlineEye />
                        </span>
                        <span
                            className={`cursor-pointer p-2 hover:${textTheme}`}
                            onClick={() => navigate(`/users/edit/${props.row.original._id}`)}
                        >
                            <HiOutlinePencil />
                        </span>
                    </div>
                )
            },
        },
    ], [navigate])

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <span className="text-red-500">
                    Error: {error.message}
                </span>
            </div>
        )
    }

    return (
        <>
            <div className="mb-4">
                <Input
                    placeholder="Search users..."
                    onChange={(e) => debouncedSearch(e.target.value)}
                    className="max-w-md"
                />
            </div>
            
            <DataTable
                ref={tableRef}
                columns={columns}
                data={data?.data?.data || []}
                loading={isLoading}
                pagingData={{
                    total: data?.data?.total || 0,
                    pageIndex: pagination.page,
                    pageSize: pagination.limit,
                }}
                onPaginationChange={(page) => setPagination(prev => ({ ...prev, page }))}
                onSelectChange={(limit) => setPagination({ page: 1, limit })}
            />
        </>
    )
}

export default UserTable