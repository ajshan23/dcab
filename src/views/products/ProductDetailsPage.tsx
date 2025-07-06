import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  apiGetProductById, 
  apiGetProductAssignments,
  apiGetProductStockHistory
} from '@/services/ProductService';
import { 
  Badge, 
  Button, 
  Card, 
  Notification, 
  toast
} from '@/components/ui';
import DataTable from '@/components/shared/DataTable';
import type { ColumnDef } from '@/components/shared/DataTable';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { MdAssignment, MdHistory } from 'react-icons/md';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/Tabs';
import { Divider } from './components/Divider';
import { Loading } from './components/Loading';

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

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch product details
  const { 
    data: productData, 
    isLoading: isLoadingProduct,
    error: productError
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiGetProductById(id as string),
    enabled: !!id,
    onSuccess: (data) => {
      console.log('Product data response:', data);
    }
  });

  // Fetch assignment history
  const {
    data: assignmentsData,
    isLoading: isLoadingAssignments,
    error: assignmentsError,
    refetch: refetchAssignments
  } = useQuery({
    queryKey: ['product-assignments', id],
    queryFn: () => apiGetProductAssignments(id as string),
    enabled: !!id
  });

  // Fetch stock history
  const {
    data: stockHistoryData,
    isLoading: isLoadingStockHistory,
    error: stockHistoryError
  } = useQuery({
    queryKey: ['product-stock-history', id],
    queryFn: () => apiGetProductStockHistory(id as string),
    enabled: !!id
  });

  // Assignment history columns
  const assignmentColumns: ColumnDef<any>[] = [
    {
      header: 'Employee',
      accessorKey: 'employee',
      cell: (props) => (
        <span>
          {props.row.original.employee?.name || 'Unknown'} 
          ({props.row.original.employee?.empId || 'N/A'})
        </span>
      ),
    },
    {
      header: 'Assigned On',
      accessorKey: 'assignedAt',
      cell: (props) => (
        <span>
          {new Date(props.row.original.assignedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Returned On',
      accessorKey: 'returnedAt',
      cell: (props) => (
        <span>
          {props.row.original.returnedAt 
            ? new Date(props.row.original.returnedAt).toLocaleDateString() 
            : '-'}
        </span>
      ),
    },
    {
      header: 'Quantity',
      accessorKey: 'quantity',
      cell: (props) => (
        <span>{props.row.original.quantity}</span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (props) => (
        <Badge className={statusColorMap[props.row.original.status] || 'bg-gray-500'}>
          {props.row.original.status}
        </Badge>
      ),
    },
    {
      header: 'Condition',
      accessorKey: 'condition',
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
  ];

  // Stock history columns
  const stockHistoryColumns: ColumnDef<any>[] = [
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: (props) => (
        <span>
          {new Date(props.row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'User',
      accessorKey: 'user',
      cell: (props) => (
        <span>{props.row.original.user?.username || 'System'}</span>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (props) => (
        <Badge>
          {props.row.original.type}
        </Badge>
      ),
    },
    {
      header: 'Change',
      accessorKey: 'quantity',
      cell: (props) => (
        <span className={props.row.original.quantity > 0 ? 'text-green-500' : 'text-red-500'}>
          {props.row.original.quantity > 0 ? '+' : ''}{props.row.original.quantity}
        </span>
      ),
    },
    {
      header: 'Previous Stock',
      accessorKey: 'previousStock',
      cell: (props) => (
        <span>{props.row.original.previousStock}</span>
      ),
    },
    {
      header: 'New Stock',
      accessorKey: 'newStock',
      cell: (props) => (
        <span>{props.row.original.newStock}</span>
      ),
    },
    {
      header: 'Notes',
      accessorKey: 'notes',
      cell: (props) => (
        <span>{props.row.original.notes || '-'}</span>
      ),
    },
  ];

  // Handle errors
  if (productError || assignmentsError || stockHistoryError) {
    toast.push(
      <Notification title="Error" type="danger">
        {productError?.message || assignmentsError?.message || stockHistoryError?.message || 'Failed to load product details'}
      </Notification>
    );
  }

  if (isLoadingProduct) {
    return <Loading />;
  }

  if (!productData?.data) {
    return <div className="p-4 text-center">Product not found</div>;
  }

  // Extract product data with proper fallbacks
  const product = productData.data;
  const categoryName = typeof product.category === 'object' 
    ? product.category?.name 
    : product.category;
  const branchName = typeof product.branch === 'object' 
    ? product.branch?.name 
    : product.branch;

  console.log('Processed product data:', {
    ...product,
    categoryName,
    branchName
  });

  console.log(' product :',product);
  return (
    <div className="container mx-auto p-4">
      <Button
        className="mb-4"
        variant="plain"
        icon={<HiOutlineArrowLeft />}
        onClick={() => navigate(-1)}
      >
        Back to Products
      </Button>

      {/* Product Details Card */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{product?.data?.name || 'No name'}</h2>
            <p className="text-gray-600 mb-4">{product?.data?.model || 'No model'}</p>
            
            <div className="space-y-3">
              <div>
                <span className="font-semibold">Serial Number:</span> 
                {product?.data?.serialNumber || '-'}
              </div>
              <div>
                <span className="font-semibold">Category:</span> 
                {product?.data?.category?.name || '-'}
              </div>
              <div>
                <span className="font-semibold">Branch:</span> 
                {product?.data?.branch?.name || '-'}
              </div>
              {product.warrantyDate && (
                <div>
                  <span className="font-semibold">Warranty Until:</span> 
                  {new Date(product?.data?.warrantyDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-4 mb-4">
              <Badge className={product.availableStock > 0 ? 'bg-emerald-500' : 'bg-red-500'}>
                Stock: {product.availableStock ?? 0}/{product.totalStock ?? 0}
              </Badge>
              <Badge className={product.complianceStatus ? 'bg-green-500' : 'bg-red-500'}>
                Compliance: {product.complianceStatus ? 'Compliant' : 'Non-compliant'}
              </Badge>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-gray-600">{product.notes || 'No notes available'}</p>
            </div>
          </div>
        </div>
      </Card>

      <Divider />

      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">
            <div className="flex items-center gap-2">
              <MdAssignment /> Assignments
            </div>
          </TabsTrigger>
          <TabsTrigger value="history">
            <div className="flex items-center gap-2">
              <MdHistory /> Stock History
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="assignments">
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Assignment History</h3>
            <p className="text-gray-500">All assignments for this product</p>
          </div>

          {isLoadingAssignments ? (
            <Loading />
          ) : (
            <Card>
              <DataTable
                columns={assignmentColumns}
                data={assignmentsData?.data?.data || []}
              />
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Stock History</h3>
            <p className="text-gray-500">All stock changes for this product</p>
          </div>

          {isLoadingStockHistory ? (
            <Loading />
          ) : (
            <Card>
              <DataTable
                columns={stockHistoryColumns}
                data={stockHistoryData?.data?.data || []}
              />
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductDetailsPage;