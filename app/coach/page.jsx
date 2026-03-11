import CoachPage from '@/components/CoachPage';
import MainLayout from '@/components/MainLayout';

export const metadata = {
    title: 'Coach - StudyMaster',
    description: 'Chat directly with your AI Coach for guidance and help',
};

export default function CoachRoute() {
    return (
        <MainLayout isFullBleed={true}>
            <CoachPage />
        </MainLayout>
    )
}
