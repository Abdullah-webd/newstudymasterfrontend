'use client'

import MainLayout from '@/components/MainLayout'
import Timetable from '@/components/Timetable'

export default function TimetablePage() {
    return (
        <MainLayout isFullBleed={true}>
            <Timetable />
        </MainLayout>
    )
}
