import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface Country {
  name: string;
  code: string;
  continent: string;
  capital: string;
  population: number;
  coordinates: { lat: number; lng: number };
}

interface RoutePoint {
  country: Country;
  type: 'start' | 'end';
}

interface Route {
  start: Country;
  end: Country;
  distance: number;
  duration: string;
  path: { lat: number; lng: number }[];
}

const countries: Country[] = [
  { name: 'Россия', code: 'RU', continent: 'Азия', capital: 'Москва', population: 146000000, coordinates: { lat: 55.7558, lng: 37.6176 } },
  { name: 'США', code: 'US', continent: 'Северная Америка', capital: 'Вашингтон', population: 331000000, coordinates: { lat: 38.9072, lng: -77.0369 } },
  { name: 'Китай', code: 'CN', continent: 'Азия', capital: 'Пекин', population: 1440000000, coordinates: { lat: 39.9042, lng: 116.4074 } },
  { name: 'Германия', code: 'DE', continent: 'Европа', capital: 'Берлин', population: 83000000, coordinates: { lat: 52.5200, lng: 13.4050 } },
  { name: 'Бразилия', code: 'BR', continent: 'Южная Америка', capital: 'Бразилиа', population: 215000000, coordinates: { lat: -15.8267, lng: -47.9218 } },
  { name: 'Индия', code: 'IN', continent: 'Азия', capital: 'Нью-Дели', population: 1380000000, coordinates: { lat: 28.6139, lng: 77.2090 } },
  { name: 'Франция', code: 'FR', continent: 'Европа', capital: 'Париж', population: 67000000, coordinates: { lat: 48.8566, lng: 2.3522 } },
  { name: 'Япония', code: 'JP', continent: 'Азия', capital: 'Токио', population: 126000000, coordinates: { lat: 35.6762, lng: 139.6503 } },
];

export default function Index() {
  const [currentPage, setCurrentPage] = useState<'home' | 'map' | 'search' | 'routes'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [routeStart, setRouteStart] = useState<Country | null>(null);
  const [routeEnd, setRouteEnd] = useState<Country | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [isRouteMode, setIsRouteMode] = useState(false);

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.capital.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setLocationError('Не удалось определить местоположение');
        }
      );
    } else {
      setLocationError('Геолокация не поддерживается');
    }
  }, []);

  const formatPopulation = (pop: number) => {
    return (pop / 1000000).toFixed(1) + 'M';
  };

  const calculateDistance = (start: Country, end: Country): number => {
    const R = 6371; // Радиус Земли в км
    const dLat = (end.coordinates.lat - start.coordinates.lat) * Math.PI / 180;
    const dLng = (end.coordinates.lng - start.coordinates.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(start.coordinates.lat * Math.PI / 180) * Math.cos(end.coordinates.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const buildRoute = (start: Country, end: Country): Route => {
    const distance = calculateDistance(start, end);
    const duration = `${Math.round(distance / 800)} ч ${Math.round((distance % 800) / 13)} мин`; // Примерная скорость самолета
    
    // Создаем промежуточные точки для визуализации пути
    const path = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      path.push({
        lat: start.coordinates.lat + (end.coordinates.lat - start.coordinates.lat) * ratio,
        lng: start.coordinates.lng + (end.coordinates.lng - start.coordinates.lng) * ratio
      });
    }
    
    return { start, end, distance, duration, path };
  };

  const handleRouteSelection = (country: Country) => {
    if (!routeStart) {
      setRouteStart(country);
    } else if (!routeEnd && country.code !== routeStart.code) {
      setRouteEnd(country);
      const route = buildRoute(routeStart, country);
      setCurrentRoute(route);
    } else {
      // Reset route
      setRouteStart(country);
      setRouteEnd(null);
      setCurrentRoute(null);
    }
  };

  const clearRoute = () => {
    setRouteStart(null);
    setRouteEnd(null);
    setCurrentRoute(null);
    setIsRouteMode(false);
  };

  const renderNavigation = () => (
    <nav className="flex items-center justify-between p-6 bg-white shadow-lg">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-r from-coral to-teal rounded-full"></div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent">
          WorldMap
        </h1>
      </div>
      <div className="flex space-x-4">
        <Button
          variant={currentPage === 'home' ? 'default' : 'outline'}
          onClick={() => setCurrentPage('home')}
          className="transition-all duration-300 hover:scale-105"
        >
          <Icon name="Home" size={16} className="mr-2" />
          Главная
        </Button>
        <Button
          variant={currentPage === 'map' ? 'default' : 'outline'}
          onClick={() => setCurrentPage('map')}
          className="transition-all duration-300 hover:scale-105"
        >
          <Icon name="Map" size={16} className="mr-2" />
          Карта
        </Button>
        <Button
          variant={currentPage === 'search' ? 'default' : 'outline'}
          onClick={() => setCurrentPage('search')}
          className="transition-all duration-300 hover:scale-105"
        >
          <Icon name="Search" size={16} className="mr-2" />
          Поиск
        </Button>
        <Button
          variant={currentPage === 'routes' ? 'default' : 'outline'}
          onClick={() => setCurrentPage('routes')}
          className="transition-all duration-300 hover:scale-105"
        >
          <Icon name="Route" size={16} className="mr-2" />
          Маршруты
        </Button>
      </div>
    </nav>
  );

  const renderHomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-coral via-blue to-teal bg-clip-text text-transparent">
            Исследуй мир
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Интерактивная карта мира с данными о странах, городах и континентах. 
            Откройте для себя удивительные факты о нашей планете.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-coral to-pink-400 rounded-lg flex items-center justify-center mb-4">
                <Icon name="Globe" size={24} className="text-white" />
              </div>
              <CardTitle className="text-gray-800">Интерактивная карта</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Кликните по любой стране, чтобы узнать подробную информацию о ней
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-blue to-cyan-400 rounded-lg flex items-center justify-center mb-4">
                <Icon name="MapPin" size={24} className="text-white" />
              </div>
              <CardTitle className="text-gray-800">Геолокация</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Автоматическое определение вашего местоположения на карте
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-teal to-green-400 rounded-lg flex items-center justify-center mb-4">
                <Icon name="Search" size={24} className="text-white" />
              </div>
              <CardTitle className="text-gray-800">Умный поиск</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Быстрый поиск по странам, столицам и континентам
              </p>
            </CardContent>
          </Card>
        </div>

        {userLocation && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-800">
                <Icon name="MapPin" size={20} className="mr-2 text-coral" />
                Ваше местоположение
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Широта: {userLocation.lat.toFixed(4)}°<br />
                Долгота: {userLocation.lng.toFixed(4)}°
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderMapPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent">
          Интерактивная карта мира
        </h2>
        
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-2xl border-0 h-96">
              <CardContent className="p-6 h-full">
                <div className="relative h-full bg-gradient-to-br from-blue-100 to-teal-100 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Icon name="Globe" size={64} className="mx-auto mb-4 text-blue opacity-50" />
                      <p className="text-gray-600">Карта мира</p>
                      <p className="text-sm text-gray-500 mt-2">Кликните по стране для подробностей</p>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 gap-1 p-4">
                    {countries.map((country, index) => (
                      <button
                        key={country.code}
                        onClick={() => setSelectedCountry(country)}
                        className={`
                          bg-gradient-to-r from-coral to-teal rounded-lg
                          hover:scale-110 transition-all duration-300 hover:shadow-lg
                          flex items-center justify-center text-white text-xs font-semibold
                          ${selectedCountry?.code === country.code ? 'ring-4 ring-yellow scale-110' : ''}
                        `}
                        style={{
                          gridColumn: `${(index % 8) + 1}`,
                          gridRow: `${Math.floor(index / 8) + 1}`,
                          opacity: 0.8 + (index * 0.02)
                        }}
                      >
                        {country.code}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {selectedCountry ? (
              <Card className="bg-white shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-800">
                    <div className="w-8 h-8 bg-gradient-to-r from-coral to-teal rounded-full mr-3"></div>
                    {selectedCountry.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <Icon name="MapPin" size={16} className="mr-2 text-coral" />
                    <span className="text-gray-600">Столица: {selectedCountry.capital}</span>
                  </div>
                  <div className="flex items-center">
                    <Icon name="Globe" size={16} className="mr-2 text-blue" />
                    <span className="text-gray-600">Континент: {selectedCountry.continent}</span>
                  </div>
                  <div className="flex items-center">
                    <Icon name="Users" size={16} className="mr-2 text-teal" />
                    <span className="text-gray-600">Население: {formatPopulation(selectedCountry.population)}</span>
                  </div>
                  <div className="flex items-center">
                    <Icon name="Navigation" size={16} className="mr-2 text-yellow" />
                    <span className="text-gray-600 text-sm">
                      {selectedCountry.coordinates.lat.toFixed(2)}°, {selectedCountry.coordinates.lng.toFixed(2)}°
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white shadow-xl border-0">
                <CardContent className="p-6 text-center">
                  <Icon name="MousePointer" size={32} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">Выберите страну на карте</p>
                </CardContent>
              </Card>
            )}

            {userLocation && (
              <Card className="bg-gradient-to-r from-coral to-teal text-white shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Icon name="MapPin" size={20} className="mr-2" />
                    Вы здесь
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/90">
                    {userLocation.lat.toFixed(4)}°, {userLocation.lng.toFixed(4)}°
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSearchPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-6">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent">
          Поиск по странам
        </h2>

        <div className="mb-8">
          <div className="relative">
            <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Введите название страны или столицы..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-coral transition-colors"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCountries.map((country) => (
            <Card 
              key={country.code}
              className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 cursor-pointer"
              onClick={() => setSelectedCountry(country)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-800">{country.name}</CardTitle>
                  <div className="w-10 h-6 bg-gradient-to-r from-coral to-teal rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{country.code}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center">
                  <Icon name="MapPin" size={14} className="mr-2 text-coral" />
                  <span className="text-sm text-gray-600">{country.capital}</span>
                </div>
                <div className="flex items-center">
                  <Icon name="Globe" size={14} className="mr-2 text-blue" />
                  <span className="text-sm text-gray-600">{country.continent}</span>
                </div>
                <div className="flex items-center">
                  <Icon name="Users" size={14} className="mr-2 text-teal" />
                  <span className="text-sm text-gray-600">{formatPopulation(country.population)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {searchQuery && filteredCountries.length === 0 && (
          <div className="text-center py-12">
            <Icon name="Search" size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg">Ничего не найдено</p>
            <p className="text-gray-500">Попробуйте изменить запрос</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderRoutesPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent">
          Планировщик маршрутов
        </h2>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-2xl border-0 h-96">
              <CardContent className="p-6 h-full">
                <div className="relative h-full bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg overflow-hidden">
                  <div className="absolute top-4 left-4 z-10">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${routeStart ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm font-medium">
                          {routeStart ? `Старт: ${routeStart.name}` : 'Выберите точку отправления'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${routeEnd ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm font-medium">
                          {routeEnd ? `Финиш: ${routeEnd.name}` : 'Выберите точку назначения'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!routeStart && !routeEnd && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Icon name="MapPin" size={64} className="mx-auto mb-4 text-purple-400 opacity-50" />
                        <p className="text-gray-600">Выберите страны для построения маршрута</p>
                        <p className="text-sm text-gray-500 mt-2">Кликните сначала на стартовую точку, затем на конечную</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 gap-1 p-4">
                    {countries.map((country, index) => (
                      <button
                        key={country.code}
                        onClick={() => handleRouteSelection(country)}
                        className={`
                          rounded-lg transition-all duration-300 hover:shadow-lg
                          flex items-center justify-center text-white text-xs font-semibold
                          ${routeStart?.code === country.code ? 'bg-green-500 ring-4 ring-green-300 scale-110' : 
                            routeEnd?.code === country.code ? 'bg-red-500 ring-4 ring-red-300 scale-110' :
                            'bg-gradient-to-r from-coral to-teal hover:scale-110'}
                        `}
                        style={{
                          gridColumn: `${(index % 8) + 1}`,
                          gridRow: `${Math.floor(index / 8) + 1}`,
                          opacity: 0.8 + (index * 0.02)
                        }}
                      >
                        {country.code}
                      </button>
                    ))}
                    
                    {currentRoute && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <defs>
                          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FF6B6B" />
                            <stop offset="100%" stopColor="#4ECDC4" />
                          </linearGradient>
                        </defs>
                        <path
                          d={`M ${routeStart ? ((countries.findIndex(c => c.code === routeStart.code) % 8) + 0.5) * (100/8) : 0}% ${routeStart ? (Math.floor(countries.findIndex(c => c.code === routeStart.code) / 8) + 0.5) * (100/6) : 0}% 
                             L ${routeEnd ? ((countries.findIndex(c => c.code === routeEnd.code) % 8) + 0.5) * (100/8) : 0}% ${routeEnd ? (Math.floor(countries.findIndex(c => c.code === routeEnd.code) / 8) + 0.5) * (100/6) : 0}%`}
                          stroke="url(#routeGradient)"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray="10,5"
                          className="animate-pulse"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {currentRoute ? (
              <Card className="bg-white shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-800">
                    <Icon name="Route" size={20} className="mr-2 text-purple-600" />
                    Информация о маршруте
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">Отправление</span>
                    </div>
                    <span className="text-sm text-gray-600">{currentRoute.start.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">Назначение</span>
                    </div>
                    <span className="text-sm text-gray-600">{currentRoute.end.name}</span>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Icon name="MapPin" size={16} className="mr-2 text-coral" />
                        <span className="text-sm text-gray-600">Расстояние</span>
                      </div>
                      <span className="font-medium">{currentRoute.distance.toLocaleString()} км</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Icon name="Clock" size={16} className="mr-2 text-blue" />
                        <span className="text-sm text-gray-600">Время полета</span>
                      </div>
                      <span className="font-medium">{currentRoute.duration}</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={clearRoute}
                    variant="outline"
                    className="w-full mt-4 hover:bg-red-50 hover:border-red-200"
                  >
                    <Icon name="X" size={16} className="mr-2" />
                    Очистить маршрут
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white shadow-xl border-0">
                <CardContent className="p-6 text-center">
                  <Icon name="Route" size={32} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-2">Создайте маршрут</p>
                  <p className="text-sm text-gray-500">
                    1. Выберите точку отправления<br />
                    2. Выберите точку назначения<br />
                    3. Получите информацию о маршруте
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Icon name="Plane" size={20} className="mr-2" />
                  Быстрые маршруты
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      const moscow = countries.find(c => c.code === 'RU');
                      const newYork = countries.find(c => c.code === 'US');
                      if (moscow && newYork) {
                        setRouteStart(moscow);
                        setRouteEnd(newYork);
                        setCurrentRoute(buildRoute(moscow, newYork));
                      }
                    }}
                    className="w-full text-left p-2 rounded bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <div className="text-sm font-medium">Москва → Вашингтон</div>
                    <div className="text-xs opacity-90">Популярный маршрут</div>
                  </button>
                  <button 
                    onClick={() => {
                      const tokyo = countries.find(c => c.code === 'JP');
                      const paris = countries.find(c => c.code === 'FR');
                      if (tokyo && paris) {
                        setRouteStart(tokyo);
                        setRouteEnd(paris);
                        setCurrentRoute(buildRoute(tokyo, paris));
                      }
                    }}
                    className="w-full text-left p-2 rounded bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <div className="text-sm font-medium">Токио → Париж</div>
                    <div className="text-xs opacity-90">Трансконтинентальный</div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderNavigation()}
      {currentPage === 'home' && renderHomePage()}
      {currentPage === 'map' && renderMapPage()}
      {currentPage === 'search' && renderSearchPage()}
      {currentPage === 'routes' && renderRoutesPage()}
    </div>
  );
}