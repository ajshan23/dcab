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
import { apiGetDepartments } from '@/services/DepartmentService';

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

const ProductCreate = () => {
  const navigate = useNavigate();

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

  const { 
    data: departmentsData, 
    isLoading: departmentsLoading,
    error: departmentsError 
  } = useQuery({ 
    queryKey: ['departments'],
    queryFn: () => apiGetDepartments({ page: 1, limit: 100 })
  });

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name.trim(),
        model: values.model.trim(),
        categoryId: Number(values.categoryId),
        branchId: Number(values.branchId),
        departmentId: values.departmentId ? Number(values.departmentId) : undefined,
        warrantyDate: values.warrantyDate || undefined,
        complianceStatus: Boolean(values.complianceStatus),
        notes: values.notes?.trim() || undefined
      };

      const response = await apiCreateProduct(payload);
      
      if (response.status === 201) {
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
          categoryId: '',
          branchId: '',
          departmentId: '',
          warrantyDate: null,
          complianceStatus: false,
          notes: ''
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ touched, errors, isSubmitting, values, setFieldValue }) => {
          const categories = categoriesData?.data?.data || [];
          const branches = branchesData?.data?.data || [];
          const departments = departmentsData?.data?.data || [];

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
                        value: c.id,
                        label: c.name
                      }))}
                      value={values.categoryId ? {
                        value: values.categoryId,
                        label: categories.find((c: any) => c.id === values.categoryId)?.name
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
                        value: b.id,
                        label: b.name
                      }))}
                      value={values.branchId ? {
                        value: values.branchId,
                        label: branches.find((b: any) => b.id === values.branchId)?.name
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
                        value: d.id,
                        label: d.name
                      }))}
                      value={values.departmentId ? {
                        value: values.departmentId,
                        label: departments.find((d: any) => d.id === values.departmentId)?.name
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