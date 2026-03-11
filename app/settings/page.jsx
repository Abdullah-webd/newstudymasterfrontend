import MainLayout from '@/components/MainLayout'
import SettingsPage from '@/components/SettingsPage'

export const metadata = {
    title: 'Settings — StudyMaster',
    description: 'Manage your account settings, change your password, and view your unique user ID.',
}

export default function Settings() {
    return (
        <MainLayout>
            <SettingsPage />
        </MainLayout>
    )
}
