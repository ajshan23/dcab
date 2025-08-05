import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  apiGetProductById,
  apiGenerateProductQrCode
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
import { HiOutlineArrowLeft, HiOutlinePrinter } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { MdAssignment } from 'react-icons/md';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/Tabs';
import { Divider } from './components/Divider';
import { ClipLoader } from 'react-spinners';

interface Assignment {
  id: number;
  status: string;
  assignedAt: string;
  returnedAt?: string;
  condition?: string;
  employee: {
    id: number;
    name: string;
    empId?: string;
  };
  assignedBy: {
    id: number;
    username: string;
  };
}

interface ProductDetails {
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
  department?: {
    id: number;
    name: string;
  };
  warrantyDate?: string;
  complianceStatus: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  assignments: Assignment[];
  currentAssignment?: {
    id: number;
    employee: {
      id: number;
      name: string;
      empId?: string;
    };
    assignedAt: string;
    expectedReturnAt?: string;
  } | null;
  isAssigned?: boolean;
}

const statusColorMap: Record<string, string> = {
  ASSIGNED: 'bg-blue-500 text-white w-fit',
  RETURNED: 'bg-emerald-500 text-white w-fit',
  LOST: 'bg-red-500 text-white w-fit',
  DAMAGED: 'bg-amber-500 text-white w-fit'
};

const conditionColorMap: Record<string, string> = {
  EXCELLENT: 'bg-green-500 text-white w-fit',
  GOOD: 'bg-blue-500 text-white w-fit',
  FAIR: 'bg-yellow-500 text-white w-fit',
  POOR: 'bg-red-500 text-white w-fit'
};

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { 
    data: productData, 
    isLoading: isLoadingProduct,
    error: productError
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiGetProductById(Number(id)),
    enabled: !!id,
    select: (response) => ({
      ...response,
      data: {
        ...response.data,
        data: {
          ...response.data.data,
          isAssigned: response.data.data.assignments?.some(
            (a: Assignment) => a.status === 'ASSIGNED' && !a.returnedAt
          ),
          currentAssignment: response.data.data.assignments?.find(
            (a: Assignment) => !a.returnedAt
          )
        }
      }
    })
  });

  const { mutate: generateQrCode, isPending: isGeneratingQr } = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiGenerateProductQrCode(productId);
      if (!response?.qrCode) {
        throw new Error('Invalid QR code data received from server');
      }
      return response.qrCode;
    },
    onSuccess: (qrCodeData) => {
      if (typeof qrCodeData !== 'string') {
        toast.push(
          <Notification title="Error" type="danger">
            Invalid QR code data format
          </Notification>
        );
        return;
      }
      handlePrintQrCode(qrCodeData);
    },
    onError: (error: Error) => {
      toast.push(
        <Notification title="Error" type="danger">
          {error.message || 'Failed to generate QR code'}
        </Notification>
      );
    }
  });

  const handlePrintQrCode = (qrCodeData: string) => {
    if (!qrCodeData.startsWith('data:image/')) {
      toast.push(
        <Notification title="Error" type="danger">
          Invalid QR code data format
        </Notification>
      );
      return;
    }

    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (printWindow && productData?.data?.data) {
      const product = productData.data.data;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Product QR Code - ${product.name}</title>
            <style>
              body { 
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
              }
              .header {
                margin-bottom: 20px;
              }
              .qr-container {
                margin: 20px auto;
                width: 300px;
                height: 300px;
              }
              .product-info {
                margin-bottom: 20px;
                text-align: center;
              }
              .product-info p {
                margin: 8px 0;
                font-size: 16px;
              }
              img {
                width: 100%;
                height: auto;
              }
              @media print {
                body {
                  padding: 0;
                }
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>${product.name || 'Product'} QR Code</h2>
              <p class="no-print">Printing will start automatically...</p>
            </div>
            <div class="product-info">
              <p><strong>Model:</strong> ${product.model || 'N/A'}</p>
              <p><strong>ID:</strong> ${product.id}</p>
            </div>
            <div class="qr-container">
              <img src="${qrCodeData}" alt="QR Code" onerror="window.alert('Failed to load QR code image')" />
            </div>
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 300);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      toast.push(
        <Notification title="Error" type="danger">
          Could not open print window
        </Notification>
      );
    }
  };

  const handleGenerateAndPrint = () => {
    if (!id) {
      toast.push(
        <Notification title="Error" type="danger">
          Product ID is missing
        </Notification>
      );
      return;
    }
    generateQrCode(Number(id));
  };

  const assignmentColumns: ColumnDef<Assignment>[] = [
    {
      header: 'Employee',
      cell: (props) => (
        <span>
          {props.row.original.employee?.name || 'Unknown'} 
          {props.row.original.employee?.empId && ` (${props.row.original.employee.empId})`}
        </span>
      ),
    },
    {
      header: 'Assigned On',
      cell: (props) => (
        <span>
          {new Date(props.row.original.assignedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Returned On',
      cell: (props) => (
        <span>
          {props.row.original.returnedAt 
            ? new Date(props.row.original.returnedAt).toLocaleDateString() 
            : '-'}
        </span>
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
      header: 'Assigned By',
      cell: (props) => (
        <span>
          {props.row.original.assignedBy?.username || 'Unknown'}
        </span>
      ),
    },
  ];

  if (productError) {
    toast.push(
      <Notification title="Error" type="danger">
        {productError.message || 'Failed to load product details'}
      </Notification>
    );
  }

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center h-screen">
        <ClipLoader color="#3B82F6" size={40} />
      </div>
    );
  }

  if (!productData?.data?.data) {
    return <div className="p-4 text-center">Product not found</div>;
  }

  const product = productData.data.data;
  const isAssigned = product.isAssigned;
  const currentAssignment = product.currentAssignment;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-start mb-4">
        <Button
          variant="plain"
          icon={<HiOutlineArrowLeft />}
          onClick={() => navigate(-1)}
        >
          Back to Products
        </Button>
        
        <Button
          variant="solid"
          icon={<HiOutlinePrinter />}
          loading={isGeneratingQr}
          onClick={handleGenerateAndPrint}
        >
          Generate & Print QR
        </Button>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
            <p className="text-gray-600 mb-4">{product.model}</p>
            
            <div className="space-y-3">
              <div>
                <span className="font-semibold">Category:</span> 
                <span className="ml-2">{product.category?.name || '-'}</span>
              </div>
              <div>
                <span className="font-semibold">Branch:</span> 
                <span className="ml-2">{product.branch?.name || '-'}</span>
              </div>
              {product.department && (
                <div>
                  <span className="font-semibold">Department:</span> 
                  <span className="ml-2">{product.department.name}</span>
                </div>
              )}
              {product.warrantyDate && (
                <div>
                  <span className="font-semibold">Warranty Until:</span> 
                  <span className="ml-2">
                    {new Date(product.warrantyDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div>
                <span className="font-semibold">Created At:</span> 
                <span className="ml-2">
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="font-semibold">Last Updated:</span> 
                <span className="ml-2">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-4 mb-4">
              <Badge className={isAssigned ? 'text-white bg-blue-500' : 'text-white bg-emerald-500'}>
                {isAssigned ? 'Assigned' : 'Available'}
              </Badge>
              <Badge className={product.complianceStatus ? 'text-white bg-green-500' : 'text-white bg-red-500'}>
                {product.complianceStatus ? 'Compliant' : 'Non-compliant'}
              </Badge>
            </div>

            {isAssigned && currentAssignment && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Currently Assigned To</h3>
                <p className="text-gray-800 dark:text-gray-200">
                  {currentAssignment.employee.name}
                  {currentAssignment.employee.empId && ` (${currentAssignment.employee.empId})`}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Assigned on: {new Date(currentAssignment.assignedAt).toLocaleDateString()}
                </p>
                {currentAssignment.expectedReturnAt && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Expected return: {new Date(currentAssignment.expectedReturnAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {product.notes || 'No notes available'}
              </p>
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
        </TabsList>
        
        <TabsContent value="assignments">
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Assignment History</h3>
            <p className="text-gray-500">All assignments for this product</p>
          </div>

          {product.assignments?.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-gray-500">No assignments found for this product</p>
            </Card>
          ) : (
            <Card>
              <DataTable
                columns={assignmentColumns}
                data={product.assignments || []}
              />
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductDetailsPage;