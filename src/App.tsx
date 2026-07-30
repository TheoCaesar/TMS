import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { TripsPage } from '@/pages/TripsPage';
import { BookingsPage } from '@/pages/BookingsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ExplorePage } from '@/modules/tours/pages/ExplorePage';
import { TourDetailPage } from '@/modules/tours/pages/TourDetailPage';
import { FlightSearchPage } from '@/modules/flights/pages/FlightSearchPage';
import { AccommodationSearchPage } from '@/modules/accommodation/pages/AccommodationSearchPage';
import { FoodDiscoverPage } from '@/modules/food/pages/FoodDiscoverPage';
import { TransportBookingPage } from '@/modules/transport/pages/TransportBookingPage';
import { EmergencyPage } from '@/modules/emergency/pages/EmergencyPage';
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { RegisterPage } from '@/modules/auth/pages/RegisterPage';
import { ROUTES } from '@/lib/routes';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.explore} element={<ExplorePage />} />
        <Route path={`${ROUTES.explore}/:slug`} element={<TourDetailPage />} />
        <Route path={ROUTES.flights} element={<FlightSearchPage />} />
        <Route path={ROUTES.hotels} element={<AccommodationSearchPage />} />
        <Route path={ROUTES.food} element={<FoodDiscoverPage />} />
        <Route path={ROUTES.transport} element={<TransportBookingPage />} />
        <Route path={ROUTES.emergency} element={<EmergencyPage />} />
        <Route path={ROUTES.trips} element={<TripsPage />} />
        <Route path={ROUTES.bookings} element={<BookingsPage />} />
        <Route path={ROUTES.profile} element={<ProfilePage />} />
        <Route path={ROUTES.auth.login} element={<LoginPage />} />
        <Route path={ROUTES.auth.register} element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}

export default App;
