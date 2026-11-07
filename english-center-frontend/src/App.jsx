import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';
import { ROLES } from './utils/constants';

// Pages
import LoginPage from './pages/auth/LoginPage';
// Super Admin
import CenterListPage from './pages/super-admin/CenterListPage';
// Admin
import DashboardPage from './pages/admin/DashboardPage';
import StudentListPage from './pages/admin/StudentListPage';
import ClassListPage from './pages/admin/ClassListPage';
import TeacherListPage from './pages/admin/TeacherListPage';
import SchedulePage from './pages/admin/SchedulePage';
import AttendanceAlertPage from './pages/admin/AttendanceAlertPage';
import ZaloHistoryPage from './pages/admin/ZaloHistoryPage';
// Teacher
import MyClassesPage from './pages/teacher/MyClassesPage';
import AttendancePage from './pages/teacher/AttendancePage';
import ExamCreatePage from './pages/teacher/ExamCreatePage';
import ExamScorePage from './pages/teacher/ExamScorePage';
import ExamResultsPage from './pages/teacher/ExamResultsPage';
import MySchedulePage from './pages/teacher/MySchedulePage';
// Student
import ExamTakingPage from './pages/student/ExamTakingPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#1e3a8a',
          colorInfo: '#0284c7',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorTextBase: '#0f172a',
          colorBgLayout: '#f8fafc',
          borderRadius: 10,
          fontFamily:
            "'Be Vietnam Pro', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: 14,
          wireframe: false,
        },
        components: {
          Button: {
            controlHeight: 38,
            controlHeightLG: 46,
            fontWeight: 600,
            borderRadius: 8,
            borderRadiusLG: 10,
          },
          Card: {
            borderRadiusLG: 16,
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#334155',
            rowHoverBg: '#f8fafc',
            borderColor: '#f1f5f9',
          },
          Input: {
            controlHeight: 38,
            controlHeightLG: 44,
            borderRadius: 8,
          },
          Select: {
            controlHeight: 38,
            controlHeightLG: 44,
            borderRadius: 8,
          },
        },
      }}
    >
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Trang công khai */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/thi/:examId" element={<ExamTakingPage />} />

                {/* Khu vực yêu cầu đăng nhập */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Super Admin */}
                  <Route
                    path="super-admin/centers"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <CenterListPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="super-admin/logs"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <ZaloHistoryPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Trung Tâm */}
                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="students"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
                        <StudentListPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="classes"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
                        <ClassListPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="teachers"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
                        <TeacherListPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="schedule"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
                        <SchedulePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="attendance-alerts"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
                        <AttendanceAlertPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="zalo-history"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.GIAO_VIEN]}>
                        <ZaloHistoryPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Giáo Viên */}
                  <Route
                    path="my-classes"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.GIAO_VIEN, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
                        <MyClassesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="attendance/:sessionId"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.GIAO_VIEN, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
                        <AttendancePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="exam/create"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.GIAO_VIEN, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
                        <ExamCreatePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="exam/score/:examId"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.GIAO_VIEN, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
                        <ExamScorePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="exam/results/:examId"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.GIAO_VIEN, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
                        <ExamResultsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="my-schedule"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.GIAO_VIEN, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
                        <MySchedulePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Redirect mặc định */}
                  <Route index element={<Navigate to="/dashboard" replace />} />
                </Route>

                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
}
