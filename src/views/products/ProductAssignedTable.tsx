import { useState, useMemo, useRef } from 'react';
import DataTable from '@/components/shared/DataTable';
import { HiOutlineEye, HiOutlineRefresh } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import type { DataTableResetHandle, ColumnDef } from '@/components/shared/DataTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import Input from '@/components/ui/Input';
import { apiGetActiveAssignments, apiReturnProduct } from '@/services/ProductService';
import Badge from '@/components/ui/Badge';
import { Button, Dialog, Notification, toast, Select } from '@/components/ui';
import { HiOutlineCheckCircle } from 'react-icons/hi';
import { MdAssignmentReturn } from 'react-icons/md';

interface Assignment {
  id: number;
  assignedAt: string;
  expectedReturnAt?: string;
  status: string;
  returnedAt?: string;
  condition?: string;
  notes?: string;
  product: {
    id: number;
    name: string;
    model: string;
    category: {
      id: number;
      name: string;
    };
    branch: {
      id: number;
      name: string;
    };
  };
  employee: {
    id: number;
    name: string;
    empId: string;
  };
  assignedBy: {
    id: number;
    username: string;
  };
}

const AssignmentListTable = () => {
  const tableRef = useRef<DataTableResetHandle>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [returnDialog, setReturnDialog] = useState({
    open: false,
    assignment: null as { id: number; productName: string } | null,
    condition: 'GOOD' as 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  });

  // Data fetching
  const { 
    data: assignmentsResponse, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['active-assignments', pagination, searchTerm],
    queryFn: () => apiGetActiveAssignments({
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm,
    }),
  });

  // Mutations
  const returnMutation = useMutation({
    mutationFn: (data: { assignmentId: number, condition?: string, notes?: string }) => 
      apiReturnProduct(data.assignmentId, {
        condition: data.condition,
        notes: data.notes
      }),
    onSuccess: () => {
      showNotification('Product returned successfully', 'success');
      queryClient.invalidateQueries(['active-assignments']);
      resetReturnDialog();
    },
    onError: (error: any) => {
      showNotification(error.response?.data?.message || 'Failed to return product', 'danger');
    }
  });

  // Helper functions
  const showNotification = (message: string, type: 'success' | 'danger') => {
    toast.push(<Notification title={type === 'success' ? 'Success' : 'Error'} type={type}>{message}</Notification>);
  };

  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchTerm(value);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500),
    []
  );

  const resetReturnDialog = () => {
    setReturnDialog({
      open: false,
      assignment: null,
      condition: 'GOOD'
    });
  };

  const handleReturnClick = (assignment: Assignment) => {
    setReturnDialog({
      ...returnDialog,
      open: true,
      assignment: {
        id: assignment.id,
        productName: assignment.product.name
      }
    });
  };

  const handleReturnSubmit = async () => {
    if (!returnDialog.assignment?.id) {
      showNotification('No valid assignment selected', 'danger');
      return;
    }
    
    await returnMutation.mutateAsync({
      assignmentId: returnDialog.assignment.id,
      condition: returnDialog.condition,
      notes: `Returned in ${returnDialog.condition.toLowerCase()} condition`
    });
  };

  const columns: ColumnDef<Assignment>[] = useMemo(() => [
    {
      header: 'Product',
      cell: (props) => (
        <div>
          <span className="font-semibold block">{props.row.original.product.name}</span>
          <span className="text-xs text-gray-500">{props.row.original.product.model}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (props) => props.row.original.product.category.name,
    },
    {
      header: 'Branch',
      cell: (props) => props.row.original.product.branch.name,
    },
    {
      header: 'Assigned To',
      cell: (props) => (
        <div>
          <span className="block">{props.row.original.employee.name}</span>
          <span className="text-xs text-gray-500">{props.row.original.employee.empId}</span>
        </div>
      ),
    },
    {
      header: 'Assigned By',
      cell: (props) => props.row.original.assignedBy.username,
    },
    {
      header: 'Assigned At',
      cell: (props) => new Date(props.row.original.assignedAt).toLocaleDateString(),
    },
    {
      header: 'Expected Return',
      cell: (props) => (
        props.row.original.expectedReturnAt 
          ? new Date(props.row.original.expectedReturnAt).toLocaleDateString()
          : '-'
      ),
    },
    {
      header: 'Status',
      cell: (props) => (
        <Badge className="w-fit bg-blue-500 text-white">
          Assigned
        </Badge>
      ),
    },
    {
      header: 'Actions',
      id: 'action',
      cell: (props) => {
        const assignment = props.row.original;

        return (
          <div className="flex justify-end gap-2">
            <Button
              size="xs"
              icon={<HiOutlineEye />}
              onClick={() => navigate(`/products/view/${assignment.product.id}`)}
            />
            <Button
              size="xs"
              variant="solid"
              icon={<MdAssignmentReturn />}
              onClick={() => handleReturnClick(assignment)}
            >
              Return
            </Button>
          </div>
        );
      },
    },
  ], [navigate]);

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
          placeholder="Search assignments..."
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
        data={assignmentsResponse?.data?.data || []}
        loading={isLoading}
        pagingData={{
          total: assignmentsResponse?.data?.pagination?.total || 0,
          pageIndex: pagination.page,
          pageSize: pagination.limit,
        }}
        onPaginationChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onSelectChange={(limit) => setPagination({ page: 1, limit })}
      />

      {/* Return Product Dialog */}
      <Dialog
        isOpen={returnDialog.open}
        onClose={resetReturnDialog}
        onRequestClose={resetReturnDialog}
        width={400}
      >
        <h4 className="mb-4">Return Product</h4>
        {returnDialog.assignment && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product</label>
              <p className="font-semibold">{returnDialog.assignment.productName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Condition</label>
              <Select
                value={{ 
                  value: returnDialog.condition, 
                  label: returnDialog.condition.charAt(0).toUpperCase() + 
                         returnDialog.condition.slice(1).toLowerCase() 
                }}
                options={[
                  { value: 'EXCELLENT', label: 'Excellent' },
                  { value: 'GOOD', label: 'Good' },
                  { value: 'FAIR', label: 'Fair' },
                  { value: 'POOR', label: 'Poor' }
                ]}
                onChange={(option: any) => setReturnDialog({...returnDialog, condition: option.value})}
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="plain"
                onClick={resetReturnDialog}
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

export default AssignmentListTable;