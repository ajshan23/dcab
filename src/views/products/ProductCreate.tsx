import { FormContainer, FormItem } from '@/components/ui/Form';
import Button from '@/components/ui/Button';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import { Input, Select, DatePicker, Checkbox } from '@/components/ui';
import { AdaptableCard } from '@/components/shared';
import { useNavigate } from 'react-router-dom';
import { apiCreateProduct } from '@/services/ProductService';
import toast from '@/components/ui/toast';
import Notification from '@/components/ui/Notification';
import { useQuery } from '@tanstack/react-query';
import { apiGetCategories } from '@/services/CategoryService';
import { apiGetBranches } from '@/services/BranchService';

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required('Product name is required')
    .min(2, 'Too Short!')
    .max(100, 'Too Long!'),
  model: Yup.string()
    .required('Model is required'),
  serialNumber: Yup.string()
    .required('Serial number is required'),
  category: Yup.string()
    .required('Category is required'),
  totalStock: Yup.number()
    .required('Total stock is required')
    .min(1, 'Must be at least 1'),
  branch: Yup.string()
    .required('Branch is required')
});

const ProductCreate = () => {
  const navigate = useNavigate();

  // Fetch categories and branches with proper error handling
  const { 
    data: categoriesData, 
    isLoading: categoriesLoading,
    error: categoriesError 
  } = useQuery({ 
    queryKey: ['categories'],
    queryFn: () => apiGetCategories({ page: 1, limit: 100 })
  });

  const { 
    data: branchesData, 
    isLoading: branchesLoading,
    error: branchesError 
  } = useQuery({ 
    queryKey: ['branches'],
    queryFn: () => apiGetBranches({ page: 1, limit: 100 })
  });

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true);
    try {
      // Prepare payload with proper types
      const payload = {
        name: values.name.trim(),
        model: values.model.trim(),
        serialNumber: values.serialNumber.trim(),
        category: values.category,
        branch: values.branch,
        totalStock: Number(values.totalStock),
        availableStock: Number(values.totalStock), // Initialize same as totalStock
        warrantyDate: values.warrantyDate || undefined,
        complianceStatus: Boolean(values.complianceStatus),
        notes: values.notes?.trim() || undefined
      };
  
      console.log('Submitting product:', payload); // Debug log
  
      const response = await apiCreateProduct(payload);
      
      if (response.success) {
        toast.push(
          <Notification title="Success" type="success">
            Product created successfully
          </Notification>
        );
        navigate('/products');
      } else {
        throw new Error(response.message || 'Failed to create product');
      }
    } catch (error: any) {
      console.error('Product creation error:', error);
      
      let errorMessage = 'Failed to create product';
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdaptableCard className="h-full" bodyClass="h-full">
      <div className="lg:flex items-center justify-between mb-4">
        <h3>Create New Product</h3>
      </div>
      
      <Formik
        initialValues={{
          name: '',
          model: '',
          serialNumber: '',
          category: '',
          totalStock: 1,
          branch: '',
          warrantyDate: null,
          complianceStatus: false,
          notes: ''
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ touched, errors, isSubmitting, values, setFieldValue }) => {
          // Extract data arrays from responses
          const categories = categoriesData?.data?.data || [];
          const branches = branchesData?.data?.data || [];

          return (
            <Form>
              <FormContainer>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Name */}
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

                  {/* Model */}
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

                  {/* Serial Number */}
                  <FormItem
                    label="Serial Number"
                    invalid={!!errors.serialNumber && touched.serialNumber}
                    errorMessage={errors.serialNumber as string}
                  >
                    <Field
                      type="text"
                      autoComplete="off"
                      name="serialNumber"
                      placeholder="Serial number"
                      component={Input}
                    />
                  </FormItem>

                  {/* Category */}
                  <FormItem
                    label="Category"
                    invalid={!!errors.category && touched.category}
                    errorMessage={errors.category as string}
                  >
                    <Select
                      placeholder={categoriesLoading ? "Loading..." : "Select Category"}
                      loading={categoriesLoading}
                      options={categories.map((c: any) => ({
                        value: c._id,
                        label: c.name
                      }))}
                      value={values.category ? {
                        value: values.category,
                        label: categories.find((c: any) => c._id === values.category)?.name
                      } : null}
                      onChange={(option: any) => setFieldValue('category', option?.value)}
                    />
                    {categoriesError && (
                      <div className="text-red-500 text-sm mt-1">
                        Failed to load categories: {categoriesError.message}
                      </div>
                    )}
                  </FormItem>

                  {/* Total Stock */}
                  <FormItem
                    label="Total Stock"
                    invalid={!!errors.totalStock && touched.totalStock}
                    errorMessage={errors.totalStock as string}
                  >
                    <Field
                      type="number"
                      autoComplete="off"
                      name="totalStock"
                      placeholder="Total stock"
                      component={Input}
                      min={1}
                    />
                  </FormItem>

                  {/* Branch */}
                  <FormItem
                    label="Branch"
                    invalid={!!errors.branch && touched.branch}
                    errorMessage={errors.branch as string}
                  >
                    <Select
                      placeholder={branchesLoading ? "Loading..." : "Select Branch"}
                      loading={branchesLoading}
                      options={branches.map((b: any) => ({
                        value: b._id,
                        label: b.name
                      }))}
                      value={values.branch ? {
                        value: values.branch,
                        label: branches.find((b: any) => b._id === values.branch)?.name
                      } : null}
                      onChange={(option: any) => setFieldValue('branch', option?.value)}
                    />
                    {branchesError && (
                      <div className="text-red-500 text-sm mt-1">
                        Failed to load branches: {branchesError.message}
                      </div>
                    )}
                  </FormItem>

                  {/* Other fields... */}
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
                    loading={isSubmitting}
                  >
                    Create Product
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

export default ProductCreate;