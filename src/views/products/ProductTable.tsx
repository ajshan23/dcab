import { useState, useMemo, useRef } from 'react';
import DataTable from '@/components/shared/DataTable';
import { HiOutlineEye, HiOutlinePencil, HiOutlineUserAdd, HiOutlineRefresh } from 'react-icons/hi';
import useThemeClass from '@/utils/hooks/useThemeClass';
import { useNavigate } from 'react-router-dom';
import type { DataTableResetHandle, ColumnDef } from '@/components/shared/DataTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import Input from '@/components/ui/Input';
import { 
    apiGetProducts, 
    apiAssignProduct,
    apiReturnProduct,
    apiGetProductAssignments
} from '@/services/ProductService';
import { apiGetEmployees } from '@/services/EmployeeService.ts';
import type { ApiResponse } from '@/@types';
import Badge from '@/components/ui/Badge';
import { Button, Select, Dialog, Notification, toast, DatePicker } from '@/components/ui';
import { HiOutlineArrowLeft, HiOutlineCheckCircle } from 'react-icons/hi';
import { MdAssignmentReturn } from 'react-icons/md';
import { FaBoxOpen } from 'react-icons/fa';

const statusColorMap: Record<string, string> = {
    assigned: 'bg-blue-500',
    returned: 'bg-emerald-500',
    lost: 'bg-red-500',
    damaged: 'bg-amber-500'
};

const conditionColorMap: Record<string, string> = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    fair: 'bg-yellow-500',
    poor: 'bg-red-500'
};

const ProductTable = () => {
    const tableRef = useRef<DataTableResetHandle>(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { textTheme } = useThemeClass();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
    });
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [returnDialogOpen, setReturnDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{
        id: string;
        name: string;
        availableStock: number;
    } | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<{
        id: string;
        productName: string;
    } | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [expectedReturnDate, setExpectedReturnDate] = useState<Date | null>(null);
    const [notes, setNotes] = useState('');
    const [returnCondition, setReturnCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
    const [productAssignments, setProductAssignments] = useState<any[]>([]);
    const [showAssignments, setShowAssignments] = useState<string | null>(null);
    const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

    const { 
        data: productsResponse, 
        isLoading, 
        error,
        refetch
    } = useQuery<ApiResponse<any>>({
        queryKey: ['products', pagination, searchTerm],
        queryFn: () => apiGetProducts({
            page: pagination.page,
            limit: pagination.limit,
            search: searchTerm
        }),
    });

    const { data: employeesResponse } = useQuery<ApiResponse<any>>({
        queryKey: ['employees-for-assignment'],
        queryFn: () => apiGetEmployees({ 
            page: 1, 
            limit: 100,
            status: 'active'
        })
    });

    const assignMutation = useMutation({
        mutationFn: apiAssignProduct,
        onSuccess: () => {
            toast.push(
                <Notification title="Success" type="success">
                    Product assigned successfully
                </Notification>
            );
            queryClient.invalidateQueries(['products']);
            resetAssignmentForm();
        },
        onError: (error: any) => {
            toast.push(
                <Notification title="Error" type="danger">
                    {error.response?.data?.message || 'Failed to assign product'}
                </Notification>
            );
        }
    });

    const returnMutation = useMutation({
        mutationFn: (data: {assignmentId: string, condition?: string, notes?: string}) => 
            apiReturnProduct(data.assignmentId, {
                condition: data.condition,
                notes: data.notes
            }),
        onSuccess: () => {
            toast.push(
                <Notification title="Success" type="success">
                    Product returned successfully
                </Notification>
            );
            queryClient.invalidateQueries(['products']);
            resetReturnForm();
            setProductAssignments(prev => 
                prev.map(a => 
                    a._id === selectedAssignment?.id 
                        ? {...a, status: 'returned', condition: returnCondition} 
                        : a
                )
            );
        },
        onError: (error: any) => {
            toast.push(
                <Notification title="Error" type="danger">
                    {error.response?.data?.message || 'Failed to return product'}
                </Notification>
            );
        }
    });

    const loadAssignments = async (productId: string) => {
        try {
            setIsLoadingAssignments(true);
            const response = await apiGetProductAssignments(productId);
            console.log('Assignments response:', response.data.data);
            setProductAssignments(response.data.data || []);
            setShowAssignments(productId);
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load assignments
                </Notification>
            );
            console.error('Error loading assignments:', error);
        } finally {
            setIsLoadingAssignments(false);
        }
    };

    const debouncedSearch = useMemo(
        () => debounce((value: string) => {
            setSearchTerm(value);
            setPagination(prev => ({ ...prev, page: 1 }));
        }, 500),
        []
    );

    const resetAssignmentForm = () => {
        setSelectedProduct(null);
        setSelectedEmployee(null);
        setQuantity(1);
        setExpectedReturnDate(null);
        setNotes('');
        setAssignDialogOpen(false);
    };

    const resetReturnForm = () => {
        setSelectedAssignment(null);
        setReturnCondition('good');
        setReturnDialogOpen(false);
    };

    const handleAssignClick = (product: any) => {
        setSelectedProduct({
            id: product._id,
            name: product.name,
            availableStock: product.availableStock
        });
        setQuantity(1);
        setAssignDialogOpen(true);
    };

    const handleReturnClick = (assignment: any) => {
        console.log('Assignment data:', assignment);
        if (!assignment._id && !assignment.id) {
            console.error('No ID found in assignment:', assignment);
            toast.push(
                <Notification title="Error" type="danger">
                    Invalid assignment data
                </Notification>
            );
            return;
        }
        
        setSelectedAssignment({
            id: assignment._id || assignment.id,
            productName: assignment.product?.name || 'Unknown Product'
        });
        setReturnDialogOpen(true);
    };

    const handleAssignSubmit = async () => {
        if (!selectedProduct || !selectedEmployee) return;
        
        await assignMutation.mutateAsync({
            productId: selectedProduct.id,
            employeeId: selectedEmployee,
            quantity,
            expectedReturnAt: expectedReturnDate?.toISOString(),
            notes
        });
    };

    const handleReturnSubmit = async () => {
        console.log('Attempting to return:', selectedAssignment);
        if (!selectedAssignment?.id) {
            toast.push(
                <Notification title="Error" type="danger">
                    No valid assignment selected
                </Notification>
            );
            return;
        }
        
        try {
            await returnMutation.mutateAsync({
                assignmentId: selectedAssignment.id,
                condition: returnCondition,
                notes: `Returned in ${returnCondition} condition`
            });
        } catch (error) {
            console.error('Return error:', error);
        }
    };

    const employeeOptions = useMemo(() => {
        return employeesResponse?.data?.data?.map((emp: any) => ({
            value: emp._id,
            label: `${emp.name} (${emp.empId})`
        })) || [];
    }, [employeesResponse]);

    const columns: ColumnDef<any>[] = useMemo(() => [
        {
            header: 'Product',
            accessorKey: 'name',
            cell: (props) => (
                <div className="flex items-center">
                    <span className="font-semibold">{props.row.original.name}</span>
                    {showAssignments === props.row.original._id && (
                        <Button
                            size="xs"
                            variant="plain"
                            className="ml-2"
                            icon={<HiOutlineArrowLeft />}
                            onClick={() => setShowAssignments(null)}
                        />
                    )}
                </div>
            ),
        },
        {
            header: 'Model',
            accessorKey: 'model',
            cell: (props) => (
                <span>{props.row.original.model}</span>
            ),
        },
        {
            header: 'Serial',
            accessorKey: 'serialNumber',
            cell: (props) => (
                <span className="font-mono">{props.row.original.serialNumber || '-'}</span>
            ),
        },
        {
            header: 'Stock',
            cell: (props) => {
                const product = props.row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Badge 
                            className={product.availableStock > 0 ? 'bg-emerald-500' : 'bg-red-500'}
                        >
                            {product.availableStock}/{product.totalStock}
                        </Badge>
                        {product.availableStock < product.totalStock && (
                            <Button
                                size="xs"
                                variant="plain"
                                icon={<FaBoxOpen />}
                                onClick={() => loadAssignments(product._id)}
                            >
                                View Assignments
                            </Button>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Actions',
            id: 'action',
            cell: (props) => (
                <div className="flex justify-end text-lg gap-2">
                    <Button
                        size="xs"
                        icon={<HiOutlineUserAdd />}
                        disabled={props.row.original.availableStock <= 0}
                        onClick={() => handleAssignClick(props.row.original)}
                    >
                        Assign
                    </Button>
                    <Button
                        size="xs"
                        icon={<HiOutlineEye />}
                        onClick={() => navigate(`/products/view/${props.row.original._id}`)}
                    />
                    <Button
                        size="xs"
                        icon={<HiOutlinePencil />}
                        onClick={() => navigate(`/products/edit/${props.row.original._id}`)}
                    />
                </div>
            ),
        },
    ], [navigate, showAssignments, textTheme]);

    const assignmentColumns: ColumnDef<any>[] = useMemo(() => [
        {
            header: 'Employee',
            cell: (props) => (
                <span>
                    {props.row.original.employee?.name || 'Unknown'} 
                    ({props.row.original.employee?.empId || 'N/A'})
                </span>
            ),
        },
        {
            header: 'Assigned On',
            cell: (props) => (
                <span>
                    {props.row.original.assignedAt 
                        ? new Date(props.row.original.assignedAt).toLocaleDateString() 
                        : 'N/A'}
                </span>
            ),
        },
        {
            header: 'Quantity',
            cell: (props) => (
                <span>{props.row.original.quantity}</span>
            ),
        },
        {
            header: 'Status',
            cell: (props) => (
                <Badge className={statusColorMap[props.row.original.status] || 'bg-gray-500'}>
                    {props.row.original.status}
                </Badge>
            ),
        },
        {
            header: 'Condition',
            cell: (props) => (
                props.row.original.condition ? (
                    <Badge className={conditionColorMap[props.row.original.condition] || 'bg-gray-500'}>
                        {props.row.original.condition}
                    </Badge>
                ) : (
                    <span>-</span>
                )
            ),
        },
        {
            header: 'Actions',
            cell: (props) => (
                props.row.original.status === 'assigned' ? (
                    <Button
                        size="xs"
                        icon={<MdAssignmentReturn />}
                        onClick={() => handleReturnClick({
                            _id: props.row.original._id,
                            id: props.row.original.id,
                            product: {
                                name: props.row.original.product?.name
                            },
                            ...props.row.original
                        })}
                    >
                        Return
                    </Button>
                ) : (
                    <span className="text-gray-400">Completed</span>
                )
            ),
        },
    ], []);

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <span className="text-red-500">
                    Error: {error.message}
                </span>
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <Input
                    placeholder="Search products..."
                    onChange={(e) => debouncedSearch(e.target.value)}
                    className="max-w-md"
                />
                <Button
                    icon={<HiOutlineRefresh />}
                    onClick={() => refetch()}
                >
                    Refresh
                </Button>
            </div>
            
            {showAssignments ? (
                <>
                    <div className="mb-4">
                        <h4 className="mb-2">Assignments for Product: {
                            productsResponse?.data?.data?.find((p: any) => p._id === showAssignments)?.name
                        }</h4>
                        {isLoadingAssignments ? (
                            <div className="text-center py-4">Loading assignments...</div>
                        ) : productAssignments.length > 0 ? (
                            <DataTable
                                ref={tableRef}
                                columns={assignmentColumns}
                                data={productAssignments}
                            />
                        ) : (
                            <div className="text-center py-4">
                                <p>No assignments found for this product</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <DataTable
                    ref={tableRef}
                    columns={columns}
                    data={productsResponse?.data?.data || []}
                    loading={isLoading}
                    pagingData={{
                        total: productsResponse?.data?.total || 0,
                        pageIndex: pagination.page,
                        pageSize: pagination.limit,
                    }}
                    onPaginationChange={(page) => setPagination(prev => ({ ...prev, page }))}
                    onSelectChange={(limit) => setPagination({ page: 1, limit })}
                />
            )}

            {/* Assign Product Dialog */}
            <Dialog
                isOpen={assignDialogOpen}
                onClose={resetAssignmentForm}
                onRequestClose={resetAssignmentForm}
                width={500}
            >
                <h4 className="mb-4">Assign Product</h4>
                {selectedProduct && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Product</label>
                            <p className="font-semibold">{selectedProduct.name}</p>
                            <p className="text-sm text-gray-500">
                                Available: {selectedProduct.availableStock}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Employee</label>
                            <Select
                                placeholder="Select Employee"
                                options={employeeOptions}
                                value={selectedEmployee ? 
                                    { 
                                        value: selectedEmployee, 
                                        label: employeeOptions.find(e => e.value === selectedEmployee)?.label 
                                    } : null}
                                onChange={(option: any) => setSelectedEmployee(option?.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Quantity</label>
                            <Input
                                type="number"
                                min={1}
                                max={selectedProduct.availableStock}
                                value={quantity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setQuantity(isNaN(val) ? 1 : Math.max(1, Math.min(val, selectedProduct.availableStock)));
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Expected Return Date (Optional)</label>
                            <DatePicker
                                placeholder="Select date"
                                value={expectedReturnDate}
                                onChange={(date) => setExpectedReturnDate(date)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                            <Input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Additional notes"
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <Button
                                variant="plain"
                                onClick={resetAssignmentForm}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="solid"
                                onClick={handleAssignSubmit}
                                loading={assignMutation.isLoading}
                                disabled={
                                    !selectedEmployee || 
                                    quantity < 1 || 
                                    quantity > selectedProduct.availableStock
                                }
                            >
                                Confirm Assignment
                            </Button>
                        </div>
                    </div>
                )}
            </Dialog>

            {/* Return Product Dialog */}
            <Dialog
                isOpen={returnDialogOpen}
                onClose={resetReturnForm}
                onRequestClose={resetReturnForm}
                width={400}
            >
                <h4 className="mb-4">Return Product</h4>
                {selectedAssignment && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Product</label>
                            <p className="font-semibold">{selectedAssignment.productName}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Condition</label>
                            <Select
                                value={{ value: returnCondition, label: returnCondition.charAt(0).toUpperCase() + returnCondition.slice(1) }}
                                options={[
                                    { value: 'excellent', label: 'Excellent' },
                                    { value: 'good', label: 'Good' },
                                    { value: 'fair', label: 'Fair' },
                                    { value: 'poor', label: 'Poor' }
                                ]}
                                onChange={(option: any) => setReturnCondition(option.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <Button
                                variant="plain"
                                onClick={resetReturnForm}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="solid"
                                onClick={handleReturnSubmit}
                                loading={returnMutation.isLoading}
                                icon={<HiOutlineCheckCircle />}
                            >
                                Confirm Return
                            </Button>
                        </div>
                    </div>
                )}
            </Dialog>
        </>
    );
};

export default ProductTable;