import ApiService from './ApiService';

interface Product {
  id: string;
  name: string;
  model: string;
  serialNumber?: string;
  categoryId: string;
  totalStock: number;
  availableStock: number;
  branchId: string;
  warrantyDate?: string;
  complianceStatus: boolean;
  notes?: string;
}

interface Assignment {
  id: string;
  productId: string;
  employeeId: string;
  assignedBy: string;
  assignedAt: string;
  returnedAt?: string;
  status: 'assigned' | 'returned' | 'lost' | 'damaged';
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
}

// Product-related API calls
export const apiGetProducts = async (params?: Record<string, any>) => {
  return ApiService.fetchData({
    url: '/products',
    method: 'get',
    params
  });
};

export const apiGetProductById = async (productId: string) => {
  return ApiService.fetchData({
    url: `/products/${productId}`,
    method: 'get'
  });
};
// In your ProductService.ts
export const apiCreateProduct = async (data: any) => {
    try {
      const response = await ApiService.fetchData({
        url: '/products',
        method: 'post',
        data,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Create Product Response:', response); // Debug log
      
      return response.data;
    } catch (error: any) {
      console.error('Create Product Error:', error.response?.data || error.message);
      throw error;
    }
  };

export const apiUpdateProduct = async (productId: string, data: Partial<Product>) => {
  return ApiService.fetchData({
    url: `/products/${productId}`,
    method: 'put',
    data
  });
};

export const apiDeleteProduct = async (productId: string) => {
  return ApiService.fetchData({
    url: `/products/${productId}`,
    method: 'delete'
  });
};
export const apiGetProductStockHistory = async (productId: string) => {
    return ApiService.fetchData({
      url: `/products/${productId}/history`,
      method: 'get'
    });
  };
export const apiUpdateStock = async (productId: string, adjustment: number) => {
  return ApiService.fetchData({
    url: `/products/${productId}/stock`,
    method: 'post',
    data: { adjustment }
  });
};

export const apiGetAvailableProducts = async () => {
  return ApiService.fetchData({
    url: '/products/available',
    method: 'get'
  });
};

// Assignment-related API calls
export const apiAssignProduct = async (data: {
  productId: string;
  employeeId: string;
  notes?: string;
}) => {
  return ApiService.fetchData({
    url: '/product-assignments/assign',
    method: 'post',
    data
  });
};

export const apiBulkAssignProducts = async (data: {
  employeeId: string;
  productIds: string[];
}) => {
  return ApiService.fetchData({
    url: '/product-assignments/assign/bulk',
    method: 'post',
    data
  });
};

export const apiReturnProduct = async (assignmentId: string, data?: {
  condition?: string;
  notes?: string;
}) => {
  return ApiService.fetchData({
    url: `/product-assignments/return/${assignmentId}`,
    method: 'post',
    data
  });
};

export const apiUpdateAssignment = async (assignmentId: string, data: Partial<Assignment>) => {
  return ApiService.fetchData({
    url: `/product-assignments/${assignmentId}`,
    method: 'put',
    data
  });
};

export const apiGetActiveAssignments = async () => {
  return ApiService.fetchData({
    url: '/product-assignments/active',
    method: 'get'
  });
};

export const apiGetAssignmentHistory = async (params?: {
  productId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}) => {
  return ApiService.fetchData({
    url: '/product-assignments/history',
    method: 'get',
    params
  });
};

export const apiGetProductAssignments = async (productId: string) => {
    return ApiService.fetchData({
      url: `/product-assignments/product/${productId}`,
      method: 'get',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  };
// Export all API functions
export default {
  apiGetProducts,
  apiGetProductById,
  apiCreateProduct,
  apiUpdateProduct,
  apiDeleteProduct,
  apiUpdateStock,
  apiGetAvailableProducts,
  apiAssignProduct,
  apiBulkAssignProducts,
  apiReturnProduct,
  apiUpdateAssignment,
  apiGetActiveAssignments,
  apiGetAssignmentHistory,
  apiGetProductAssignments
};