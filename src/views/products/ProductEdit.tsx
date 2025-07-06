import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FormContainer, FormItem } from '@/components/ui/Form'
import Button from '@/components/ui/Button'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import { Input, Select, DatePicker, Checkbox } from '@/components/ui'
import { AdaptableCard } from '@/components/shared'
import { apiGetProduct, apiUpdateProduct } from '@/services/ProductService'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { useQuery } from '@tanstack/react-query'
import { apiGetCategories } from '@/services/CategoryService'
import { apiGetBranches } from '@/services/BranchService'

const validationSchema = Yup.object().shape({
    name: Yup.string()
        .required('Product name is required')
        .min(2, 'Too Short!')
        .max(100, 'Too Long!'),
    model: Yup.string()
        .required('Model is required'),
    serialNumber: Yup.string()
        .required('Serial number is required'),
    categoryId: Yup.number()
        .required('Category is required'),
    totalStock: Yup.number()
        .required('Total stock is required')
        .min(1, 'Must be at least 1'),
    branchId: Yup.number()
        .required('Branch is required')
})

const ProductEdit = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    // Fetch categories and branches for dropdowns
    const { data: categories } = useQuery(['categories'], () => 
        apiGetCategories({ page: 1, limit: 100 })
    )
    const { data: branches } = useQuery(['branches'], () => 
        apiGetBranches({ page: 1, limit: 100 })
    )

    const [initialValues, setInitialValues] = useState({
        name: '',
        model: '',
        serialNumber: '',
        categoryId: '',
        totalStock: 1,
        branchId: '',
        warrantyDate: null,
        complianceStatus: false,
        notes: ''
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await apiGetProduct(id!)
                setInitialValues({
                    name: response.data.data.name,
                    model: response.data.data.model,
                    serialNumber: response.data.data.serialNumber,
                    categoryId: response.data.data.categoryId,
                    totalStock: response.data.data.totalStock,
                    branchId: response.data.data.branchId,
                    warrantyDate: response.data.data.warrantyDate || null,
                    complianceStatus: response.data.data.complianceStatus || false,
                    notes: response.data.data.notes || ''
                })
                setLoading(false)
            } catch (error: any) {
                toast.push(
                    <Notification title="Error" type="danger">
                        {error.message || 'Failed to fetch product'}
                    </Notification>
                )
                navigate('/products')
            }
        }

        if (id) {
            fetchProduct()
        }
    }, [id, navigate])

    const handleSubmit = async (values: any, { setSubmitting }: any) => {
        try {
            const resp = await apiUpdateProduct(id!, values)
            if (resp.status === 200) {
                toast.push(
                    <Notification title="Success" type="success">
                        Product updated successfully
                    </Notification>
                )
                navigate('/products')
            }
        } catch (error: any) {
            toast.push(
                <Notification title="Error" type="danger">
                    {error.message || 'Failed to update product'}
                </Notification>
            )
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <h3 className="text-gray-500">Loading product details...</h3>
            </div>
        )
    }

    return (
        <AdaptableCard className="h-full" bodyClass="h-full">
            <div className="lg:flex items-center justify-between mb-4">
                <h3>Edit Product</h3>
            </div>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ touched, errors, isSubmitting, values, setFieldValue }) => (
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
                                <FormItem
                                    label="Category"
                                    invalid={!!errors.categoryId && touched.categoryId}
                                    errorMessage={errors.categoryId as string}
                                >
                                    <Select
                                        placeholder="Select Category"
                                        options={categories?.data?.data.map((c: any) => ({
                                            value: c.id,
                                            label: c.name
                                        })) || []}
                                        value={categories?.data?.data.find((c: any) => c.id === values.categoryId) ? 
                                            { value: values.categoryId, label: categories.data.data.find((c: any) => c.id === values.categoryId).name } 
                                            : null}
                                        onChange={(option: any) => setFieldValue('categoryId', option?.value)}
                                    />
                                </FormItem>
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
                                    />
                                </FormItem>
                                <FormItem
                                    label="Branch"
                                    invalid={!!errors.branchId && touched.branchId}
                                    errorMessage={errors.branchId as string}
                                >
                                    <Select
                                        placeholder="Select Branch"
                                        options={branches?.data?.data.map((b: any) => ({
                                            value: b.id,
                                            label: b.name
                                        })) || []}
                                        value={branches?.data?.data.find((b: any) => b.id === values.branchId) ? 
                                            { value: values.branchId, label: branches.data.data.find((b: any) => b.id === values.branchId).name } 
                                            : null}
                                        onChange={(option: any) => setFieldValue('branchId', option?.value)}
                                    />
                                </FormItem>
                                <FormItem
                                    label="Warranty Date"
                                    invalid={!!errors.warrantyDate && touched.warrantyDate}
                                    errorMessage={errors.warrantyDate as string}
                                >
                                    <DatePicker
                                        placeholder="Select warranty date"
                                        value={values.warrantyDate}
                                        onChange={(date) => setFieldValue('warrantyDate', date)}
                                    />
                                </FormItem>
                                <FormItem
                                    label="Compliance Status"
                                    invalid={!!errors.complianceStatus && touched.complianceStatus}
                                    errorMessage={errors.complianceStatus as string}
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
                                    invalid={!!errors.notes && touched.notes}
                                    errorMessage={errors.notes as string}
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
                                    Update Product
                                </Button>
                            </div>
                        </FormContainer>
                    </Form>
                )}
            </Formik>
        </AdaptableCard>
    )
}

export default ProductEdit