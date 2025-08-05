import ApiService from './ApiService';

interface Product {
  id: number;
  name: string;
  model: string;
  categoryId: number;
  branchId: number;
  warrantyDate?: string;
  complianceStatus: boolean;
  notes?: string;
  assignments?: Assignment[];
}

interface Assignment {
  id: number;
  productId: number;
  employeeId: number;
  assignedById: number;
  assignedAt: string;
  returnedAt?: string;
  expectedReturnAt?: string;
  status: 'ASSIGNED' | 'RETURNED' | 'LOST' | 'DAMAGED';
  condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  notes?: string;
}

export const apiGetProducts = async (params?: Record<string, any>) => {
  return ApiService.fetchData({
    url: '/products',
    method: 'get',
    params
  });
};
export const apiGetAssignedProducts = async (params?: Record<string, any>) => {
  return ApiService.fetchData({
    url: '/products/assigned',
    method: 'get',
    params
  });
};

export const apiGetProductById = async (productId: number) => {
  return ApiService.fetchData({
    url: `/products/${productId}`,
    method: 'get'
  });
};

export const apiCreateProduct = async (data: Omit<Product, 'id'>) => {
  return ApiService.fetchData({
    url: '/products',
    method: 'post',
    data
  });
};

export const apiUpdateProduct = async (productId: number, data: Partial<Product>) => {
  return ApiService.fetchData({
    url: `/products/${productId}`,
    method: 'put',
    data
  });
};

export const apiDeleteProduct = async (productId: number) => {
  return ApiService.fetchData({
    url: `/products/${productId}`,
    method: 'delete'
  });
};

export const apiAssignProduct = async (data: {
  productId: number;
  employeeId: number;
  expectedReturnAt?: string;
  notes?: string;
}) => {
  return ApiService.fetchData({
    url: '/product-assignments/assign',
    method: 'post',
    data
  });
};

export const apiReturnProduct = async (assignmentId: number, data?: {
  condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  notes?: string;
}) => {
  return ApiService.fetchData({
    url: `/product-assignments/return/${assignmentId}`,
    method: 'post',
    data
  });
};

export const apiGetProductAssignments = async (productId: number) => {
  const d = await ApiService.fetchData({
    url: `/product-assignments/product/${productId}`,
    method: 'get'
  });
  console.log("d", d);
  return d;
};

export const apiGetActiveAssignments = async () => {
  return ApiService.fetchData({
    url: '/product-assignments/active',
    method: 'get'
  });
};
export const apiGetAssignmentHistory = async () => {
  return ApiService.fetchData({
    url: '/product-assignments/history',
    method: 'get'
  });
};

export const apiGenerateProductQrCode = async (productId: number) => {
  const response = await ApiService.fetchData({
    url: `/products/${productId}/generate-qr`,
    method: 'post'
  });
    console.log(response);
    
  // Ensure the response has the expected structure
  if (!response || !response.data?.qrCode) {
    throw new Error('Invalid response from server');
  }
  
  return response.data;
};

export default {
  apiGetProducts,
  apiGetProductById,
  apiCreateProduct,
  apiUpdateProduct,
  apiDeleteProduct,
  apiAssignProduct,
  apiReturnProduct,
  apiGetProductAssignments,
  apiGetActiveAssignments
};