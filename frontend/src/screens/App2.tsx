import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface WeatherDetails {
  name: string;
  country: string;
  region: string;
  localtime: string;
  observation_time: string;
  temprature: number;
  weather_descriptions: string[];
  wind_speed: number;
  wind_degree: number;
  humidity: number;
  cloudcover: number;
  feelslike: number;
}

interface SearchHistory {
  username: string;
  city: string;
  searched_at: string;
  result: any;
}

const App2 = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherDetails | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const navigate = useNavigate();
  const backend_url =
    import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";
  const cityInputRef = useRef<HTMLInputElement>(null);

  const isValidToken = async (token: string) => {
    try {
      const response = await axios.get(`${backend_url}/api/v1/validate-token`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Token validation failed:", error);
      return false;
    }
  };
  const validateToken = async () => {
    console.log("validate token ran");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/LoginScreen");
        return;
      }

      const validationResult = await isValidToken(token);
      if (validationResult) {
        console.log("Token is valid:", validationResult);
        setUsername(validationResult.decoded);
        localStorage.setItem("username", validationResult.decoded);
      } else {
        navigate("/LoginScreen");
      }
    } catch (error) {
      console.error("Error during token validation:", error);
      navigate("/LoginScreen");
    }
  };

  const fetchSearchHistory = async () => {
    console.log("username inside fetch search: ", username);
    const usersHistory = await axios.get(
      `${backend_url}/api/v1/get-users-search-history`,
      {
        params: {
          username,
        },
      }
    );
    console.log("users search history: ", usersHistory.data);
    setSearchHistory(usersHistory.data.history);
  };
  useEffect(() => {
    const validateAndFetch = async () => {
      await validateToken(); 
      if (username) {
        fetchSearchHistory(); 
      }
    };
  
    validateAndFetch();
  
    return () => {
      console.log("component unmounted: ", username);
    };
  }, [username]);

  const handleFetchWeatherDetails = async () => {
    if (!cityInputRef.current || !username) return;
    try {
      const response = await axios.get(
        `${backend_url}/api/v1/getweatherdetails`,
        {
          params: {
            city: cityInputRef.current.value,
            username,
          },
        }
      );

      const weatherData = response.data.data;
      const weatherDetails: WeatherDetails = {
        name: weatherData.location.name,
        country: weatherData.location.country,
        cloudcover: weatherData.current.cloudcover,
        feelslike: weatherData.current.feelslike,
        humidity: weatherData.current.humidity,
        localtime: weatherData.location.localtime,
        observation_time: weatherData.current.observation_time,
        region: weatherData.location.region,
        temprature: weatherData.current.temperature,
        weather_descriptions: weatherData.current.weather_descriptions,
        wind_degree: weatherData.current.wind_degree,
        wind_speed: weatherData.current.wind_speed,
      };

      setWeatherData(weatherDetails);
    } catch (error) {
      console.error("Error fetching weather details:", error);
    }
    if (cityInputRef.current) cityInputRef.current.value = "";
  };

  const handleLogout = () => {
    localStorage.setItem("token", "");
    window.location.reload();
  };
  return (
    <div className="bg-zinc-800 min-h-screen w-full text-white p-8 2xl:p-60">
    <div className="flex items-center space-x-2 mb-4">
    <div>{username}</div>
    <button onClick={handleLogout} className="bg-blue-700 p-2 rounded-md cursor-pointer hover:bg-blue-600 text-white">Logout</button>
    </div>
      <div className="flex space-x-4 mb-8">
        <input
          className="text-black rounded-md p-3 flex-1"
          placeholder="Enter city name here"
          type="text"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleFetchWeatherDetails();
          }}
          ref={cityInputRef}
        />
        <button
          className="p-3 bg-blue-700 hover:bg-blue-600 cursor-pointer text-white rounded-md"
          onClick={handleFetchWeatherDetails}
        >
          Search
        </button>
      </div>

      {weatherData && (
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">
            {weatherData.name}, {weatherData.country}
          </h2>
          <p className="text-gray-400">Region: {weatherData.region}</p>
          <p className="text-gray-400">Local Time: {weatherData.localtime}</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800 rounded-md shadow">
              <p className="text-lg">
                Temperature:{" "}
                <span className="font-bold">{weatherData.temprature}°C</span>
              </p>
              <p>Feels Like: {weatherData.feelslike}°C</p>
              <p>Humidity: {weatherData.humidity}%</p>
              <p>Cloud Cover: {weatherData.cloudcover}%</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-md shadow">
              <p className="text-lg">
                Wind Speed:{" "}
                <span className="font-bold">{weatherData.wind_speed} km/h</span>
              </p>
              <p>Wind Degree: {weatherData.wind_degree}°</p>
              <p>Observation Time: {weatherData.observation_time}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-400">Weather Descriptions:</p>
            <ul className="list-disc list-inside text-gray-300">
              {weatherData.weather_descriptions.map((desc, index) => (
                <li key={index}>{desc}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mt-6">Global Search History</h2>

      <div className="mt-4">
        {searchHistory.map((val, ind) => (
          <div
            className="flex flex-col items-center space-y-2 sm:justify-around sm:items-baseline sm:flex-row  rounded-md py-2 bg-gray-900 text-gray-200 my-1"
            key={ind}
          >
            <div>{val.username}</div>
            <div>{val.city}</div>
            <div>{val.searched_at}</div>
            <button
              onClick={() => {
                const weatherData = val.result;
                const weatherDetails: WeatherDetails = {
                  name: weatherData.location.name,
                  country: weatherData.location.country,
                  cloudcover: weatherData.current.cloudcover,
                  feelslike: weatherData.current.feelslike,
                  humidity: weatherData.current.humidity,
                  localtime: weatherData.location.localtime,
                  observation_time: weatherData.current.observation_time,
                  region: weatherData.location.region,
                  temprature: weatherData.current.temperature,
                  weather_descriptions:
                    weatherData.current.weather_descriptions,
                  wind_degree: weatherData.current.wind_degree,
                  wind_speed: weatherData.current.wind_speed,
                };

                setWeatherData(weatherDetails);
              }}
              className="hover:text-white"
            >
              View results
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App2;
