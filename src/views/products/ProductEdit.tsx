import { FormContainer, FormItem } from '@/components/ui/Form';
import Button from '@/components/ui/Button';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import { Input, Select, DatePicker, Checkbox } from '@/components/ui';
import { AdaptableCard } from '@/components/shared';
import { useNavigate, useParams } from 'react-router-dom';
import { apiUpdateProduct, apiGetProductById } from '@/services/ProductService';
import { apiGetCategories } from '@/services/CategoryService';
import { apiGetBranches } from '@/services/BranchService';
import { apiGetDepartments } from '@/services/DepartmentService';
import toast from '@/components/ui/toast';
import Notification from '@/components/ui/Notification';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ClipLoader } from 'react-spinners';

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required('Product name is required')
    .min(2, 'Too Short!')
    .max(100, 'Too Long!'),
  model: Yup.string()
    .required('Model is required'),
  categoryId: Yup.number()
    .required('Category is required'),
  branchId: Yup.number()
    .required('Branch is required')
});

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch product data
  const { 
    data: productResponse, 
    isLoading: productLoading,
    error: productError,
    isError: isProductError
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiGetProductById(Number(id)),
    enabled: !!id,
    retry: false
  });

  // Fetch categories, branches, and departments
  const { 
    data: categoriesResponse, 
    isLoading: categoriesLoading,
    error: categoriesError 
  } = useQuery({ 
    queryKey: ['categories'],
    queryFn: () => apiGetCategories({ page: 1, limit: 100 })
  });

  const { 
    data: branchesResponse, 
    isLoading: branchesLoading,
    error: branchesError 
  } = useQuery({ 
    queryKey: ['branches'],
    queryFn: () => apiGetBranches({ page: 1, limit: 100 })
  });

  const { 
    data: departmentsResponse, 
    isLoading: departmentsLoading,
    error: departmentsError 
  } = useQuery({ 
    queryKey: ['departments'],
    queryFn: () => apiGetDepartments({ page: 1, limit: 100 })
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (values: any) => apiUpdateProduct(Number(id), values),
    onSuccess: () => {
      queryClient.invalidateQueries(['product', id]);
      queryClient.invalidateQueries(['products']);
      toast.push(
        <Notification title="Success" type="success">
          Product updated successfully
        </Notification>
      );
      navigate('/products');
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      let errorMessage = 'Failed to update product';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.push(
        <Notification title="Error" type="danger">
          {errorMessage}
        </Notification>
      );
    }
  });

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    const payload = {
      name: values.name.trim(),
      model: values.model.trim(),
      categoryId: Number(values.categoryId),
      branchId: Number(values.branchId),
      departmentId: values.departmentId ? Number(values.departmentId) : null,
      warrantyDate: values.warrantyDate || null,
      complianceStatus: Boolean(values.complianceStatus),
      notes: values.notes?.trim() || null
    };

    updateMutation.mutate(payload);
    setSubmitting(false);
  };

  // Transform API data to form initial values
  const getInitialValues = () => {
    if (!productResponse?.data?.data) {
      return {
        name: '',
        model: '',
        categoryId: '',
        branchId: '',
        departmentId: '',
        warrantyDate: null,
        complianceStatus: false,
        notes: ''
      };
    }

    const product = productResponse.data.data;
    
    return {
      name: product.name || '',
      model: product.model || '',
      categoryId: product.categoryId?.toString() || '',
      branchId: product.branchId?.toString() || '',
      departmentId: product.departmentId?.toString() || '',
      warrantyDate: product.warrantyDate ? new Date(product.warrantyDate) : null,
      complianceStatus: product.complianceStatus || false,
      notes: product.notes || ''
    };
  };

  if (productLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader color="#3B82F6" size={40} />
      </div>
    );
  }

  if (isProductError) {
    return (
      <div className="p-4">
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded">
          Error loading product: {productError.message}
        </div>
        <Button onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!productResponse?.data?.data) {
    return (
      <div className="p-4">
        <div className="mb-4 p-4 bg-yellow-50 text-yellow-600 rounded">
          Product not found
        </div>
        <Button onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <AdaptableCard className="h-full" bodyClass="h-full">
      <div className="lg:flex items-center justify-between mb-4">
        <h3>Edit Product: {productResponse.data.data.name}</h3>
      </div>
      
      <Formik
        key={productResponse.data.data.id}
        initialValues={getInitialValues()}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ touched, errors, isSubmitting, values, setFieldValue }) => {
          const categories = categoriesResponse?.data?.data || [];
          const branches = branchesResponse?.data?.data || [];
          const departments = departmentsResponse?.data?.data || [];

          return (
            <Form>
              <FormContainer>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem
                    label="Product Name"
                    invalid={!!errors.name && touched.name}
                    errorMessage={errors.name as string}
                  >
                    <Field
                      type="text"
                      autoComplete="off"
                      name="name"
                      placeholder="Product name"
                      component={Input}
                    />
                  </FormItem>

                  <FormItem
                    label="Model"
                    invalid={!!errors.model && touched.model}
                    errorMessage={errors.model as string}
                  >
                    <Field
                      type="text"
                      autoComplete="off"
                      name="model"
                      placeholder="Model"
                      component={Input}
                    />
                  </FormItem>

                  <FormItem
                    label="Category"
                    invalid={!!errors.categoryId && touched.categoryId}
                    errorMessage={errors.categoryId as string}
                  >
                    <Select
                      placeholder={categoriesLoading ? "Loading..." : "Select Category"}
                      loading={categoriesLoading}
                      options={categories.map((c: any) => ({
                        value: c.id.toString(),
                        label: c.name
                      }))}
                      value={values.categoryId ? {
                        value: values.categoryId,
                        label: categories.find((c: any) => c.id.toString() === values.categoryId)?.name
                      } : null}
                      onChange={(option: any) => setFieldValue('categoryId', option?.value)}
                    />
                    {categoriesError && (
                      <div className="text-red-500 text-sm mt-1">
                        Failed to load categories: {categoriesError.message}
                      </div>
                    )}
                  </FormItem>

                  <FormItem
                    label="Branch"
                    invalid={!!errors.branchId && touched.branchId}
                    errorMessage={errors.branchId as string}
                  >
                    <Select
                      placeholder={branchesLoading ? "Loading..." : "Select Branch"}
                      loading={branchesLoading}
                      options={branches.map((b: any) => ({
                        value: b.id.toString(),
                        label: b.name
                      }))}
                      value={values.branchId ? {
                        value: values.branchId,
                        label: branches.find((b: any) => b.id.toString() === values.branchId)?.name
                      } : null}
                      onChange={(option: any) => setFieldValue('branchId', option?.value)}
                    />
                    {branchesError && (
                      <div className="text-red-500 text-sm mt-1">
                        Failed to load branches: {branchesError.message}
                      </div>
                    )}
                  </FormItem>

                  <FormItem
                    label="Department"
                  >
                    <Select
                      placeholder={departmentsLoading ? "Loading..." : "Select Department (Optional)"}
                      loading={departmentsLoading}
                      options={departments.map((d: any) => ({
                        value: d.id.toString(),
                        label: d.name
                      }))}
                      value={values.departmentId ? {
                        value: values.departmentId,
                        label: departments.find((d: any) => d.id.toString() === values.departmentId)?.name
                      } : null}
                      onChange={(option: any) => setFieldValue('departmentId', option?.value)}
                      isClearable
                    />
                    {departmentsError && (
                      <div className="text-red-500 text-sm mt-1">
                        Failed to load departments: {departmentsError.message}
                      </div>
                    )}
                  </FormItem>

                  <FormItem
                    label="Warranty Date"
                  >
                    <DatePicker
                      placeholder="Select warranty date"
                      value={values.warrantyDate}
                      onChange={(date) => setFieldValue('warrantyDate', date)}
                    />
                  </FormItem>

                  <FormItem
                    label="Compliance Status"
                  >
                    <Checkbox
                      name="complianceStatus"
                      checked={values.complianceStatus}
                      onChange={(val) => setFieldValue('complianceStatus', val)}
                    >
                      Compliant
                    </Checkbox>
                  </FormItem>

                  <FormItem
                    label="Notes"
                  >
                    <Field
                      as="textarea"
                      name="notes"
                      placeholder="Additional notes"
                      className="w-full h-20 p-2 border rounded"
                    />
                  </FormItem>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    type="button"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="solid"
                    type="submit"
                    loading={isSubmitting || updateMutation.isLoading}
                  >
                    Update Product
                  </Button>
                </div>
              </FormContainer>
            </Form>
          );
        }}
      </Formik>
    </AdaptableCard>
  );
};

export default ProductEdit;