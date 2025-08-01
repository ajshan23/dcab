import { Button } from '@/components/ui'
import { HiPlusCircle } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'

const EmployeeTableTools = () => {
    const navigate = useNavigate()

    return (
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <Button
                variant="solid"
                size="sm"
                icon={<HiPlusCircle />}
                onClick={() => navigate('/employees/create')}
            >
                Add Employee
            </Button>
        </div>
    )
}

export default EmployeeTableTools