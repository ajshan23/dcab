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
  apiReturnProduct
} from '@/services/ProductService';
import { apiGetEmployees } from '@/services/EmployeeService.ts';
import type { ApiResponse } from '@/@types';
import Badge from '@/components/ui/Badge';
import { Button, Select, Dialog, Notification, toast, DatePicker } from '@/components/ui';
import { HiOutlineCheckCircle } from 'react-icons/hi';
import { MdAssignmentReturn } from 'react-icons/md';

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
    id: number;
    name: string;
  } | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<{
    id: number;
    productName: string;
  } | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [expectedReturnDate, setExpectedReturnDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [returnCondition, setReturnCondition] = useState<'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'>('GOOD');

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
      search: searchTerm,
      includeAssignments: true // Ensure backend includes assignments
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
    mutationFn: (data: {assignmentId: number, condition?: string, notes?: string}) => 
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
    },
    onError: (error: any) => {
      toast.push(
        <Notification title="Error" type="danger">
          {error.response?.data?.message || 'Failed to return product'}
        </Notification>
      );
    }
  });

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
    setExpectedReturnDate(null);
    setNotes('');
    setAssignDialogOpen(false);
  };

  const resetReturnForm = () => {
    setSelectedAssignment(null);
    setReturnCondition('GOOD');
    setReturnDialogOpen(false);
  };

  const handleAssignClick = (product: any) => {
    setSelectedProduct({
      id: product.id,
      name: product.name
    });
    setAssignDialogOpen(true);
  };

  const handleReturnClick = (assignment: any) => {
    setSelectedAssignment({
      id: assignment.id,
      productName: assignment.product?.name || 'Unknown Product'
    });
    setReturnDialogOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedProduct || !selectedEmployee) return;
    
    await assignMutation.mutateAsync({
      productId: selectedProduct.id,
      employeeId: selectedEmployee,
      expectedReturnAt: expectedReturnDate?.toISOString(),
      notes
    });
  };

  const handleReturnSubmit = async () => {
    if (!selectedAssignment?.id) {
      toast.push(
        <Notification title="Error" type="danger">
          No valid assignment selected
        </Notification>
      );
      return;
    }
    
    await returnMutation.mutateAsync({
      assignmentId: selectedAssignment.id,
      condition: returnCondition,
      notes: `Returned in ${returnCondition.toLowerCase()} condition`
    });
  };

  const employeeOptions = useMemo(() => {
    return employeesResponse?.data?.data?.map((emp: any) => ({
      value: emp.id,
      label: `${emp.name} (${emp.empId})`
    })) || [];
  }, [employeesResponse]);

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      header: 'Product',
      accessorKey: 'name',
      cell: (props) => (
        <span className="font-semibold">{props.row.original.name}</span>
      ),
    },
    {
      header: 'Model',
      accessorKey: 'model',
    },
    {
      header: 'Status',
      cell: (props) => {
        const product = props.row.original;
        const isAssigned = product.assignments?.some?.(
          (a: any) => a.status === 'ASSIGNED' && !a.returnedAt
        );
        
        return (
          <Badge className={isAssigned ? 'w-fit bg-blue-500 text-white' : 'w-fit bg-emerald-500 text-white'}>
            {isAssigned ? 'Assigned' : 'Available'}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      id: 'action',
      cell: (props) => {
        const product = props.row.original;
        const activeAssignment = product.assignments?.find?.(
          (a: any) => a.status === 'ASSIGNED' && !a.returnedAt
        );
        const isAssigned = !!activeAssignment;

        return (
          <div className="flex justify-end text-lg gap-2">
            <Button
              size="xs"
              icon={<HiOutlineEye />}
              onClick={() => navigate(`/products/view/${product.id}`)}
            />
            <Button
              size="xs"
              icon={<HiOutlinePencil />}
              onClick={() => navigate(`/products/edit/${product.id}`)}
            />
            {isAssigned ? (
              <Button
                size="xs"
                variant="solid"
                icon={<MdAssignmentReturn />}
                onClick={() => handleReturnClick(activeAssignment)}
              >
                Return
              </Button>
            ) : (
              <Button
                size="xs"
                icon={<HiOutlineUserAdd />}
                onClick={() => handleAssignClick(product)}
              >
                Assign
              </Button>
            )}
          </div>
        );
      },
    },
  ], [navigate, textTheme]);

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
                disabled={!selectedEmployee}
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
                value={{ value: returnCondition, label: returnCondition.charAt(0).toUpperCase() + returnCondition.slice(1).toLowerCase() }}
                options={[
                  { value: 'EXCELLENT', label: 'Excellent' },
                  { value: 'GOOD', label: 'Good' },
                  { value: 'FAIR', label: 'Fair' },
                  { value: 'POOR', label: 'Poor' }
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