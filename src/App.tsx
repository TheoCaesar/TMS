import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { PoiExplorePage } from '@/modules/poi/pages/PoiExplorePage';
import { FlightSearchPage } from '@/modules/flights/pages/FlightSearchPage';
import { AccommodationSearchPage } from '@/modules/accommodation/pages/AccommodationSearchPage';
import { FoodDiscoverPage } from '@/modules/food/pages/FoodDiscoverPage';
import { TransportBookingPage } from '@/modules/transport/pages/TransportBookingPage';
import { EmergencyPage } from '@/modules/emergency/pages/EmergencyPage';
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { RegisterPage } from '@/modules/auth/pages/RegisterPage';
import { PaymentsPage } from '@/modules/payments/pages/PaymentsPage';
import { ROUTES } from '@/lib/routes';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.poi} element={<PoiExplorePage />} />
        <Route path={ROUTES.flights} element={<FlightSearchPage />} />
        <Route path={ROUTES.accommodation} element={<AccommodationSearchPage />} />
        <Route path={ROUTES.food} element={<FoodDiscoverPage />} />
        <Route path={ROUTES.transport} element={<TransportBookingPage />} />
        <Route path={ROUTES.emergency} element={<EmergencyPage />} />
        <Route path={ROUTES.auth.login} element={<LoginPage />} />
        <Route path={ROUTES.auth.register} element={<RegisterPage />} />
        <Route path={ROUTES.payments} element={<PaymentsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
