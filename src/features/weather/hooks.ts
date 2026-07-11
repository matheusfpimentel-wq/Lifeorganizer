import { useQuery } from '@tanstack/react-query';

/**
 * Previsão do tempo via Open-Meteo (gratuita, sem chave, CORS liberado).
 * Usa a localização do aparelho SOMENTE se a permissão já foi concedida
 * (nunca dispara o prompt); senão assume São Paulo.
 */
export type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog';

export interface Weather {
  kind: WeatherKind;
  tempC: number;
  tminC: number | null;
  tmaxC: number | null;
  rainProb: number | null; // probabilidade máxima de chuva hoje (%)
}

function kindFromCode(code: number): WeatherKind {
  if ([95, 96, 99].includes(code)) return 'storm';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 86) || (code >= 71 && code <= 77)) return 'rain';
  if ([45, 48].includes(code)) return 'fog';
  if (code === 0 || code === 1) return 'clear';
  return 'cloudy';
}

async function getCoords(): Promise<{ lat: number; lon: number }> {
  try {
    if ('permissions' in navigator) {
      const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (status.state === 'granted') {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000, maximumAge: 30 * 60 * 1000 }),
        );
        return { lat: pos.coords.latitude, lon: pos.coords.longitude };
      }
    }
  } catch {
    /* cai no padrão */
  }
  return { lat: -23.55, lon: -46.63 }; // São Paulo
}

export function useWeather() {
  return useQuery({
    queryKey: ['weather'],
    staleTime: 30 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<Weather> => {
      const { lat, lon } = await getCoords();
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        '&current=temperature_2m,weather_code' +
        '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
        '&forecast_days=1&timezone=America%2FSao_Paulo';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Previsão indisponível');
      const data = await res.json();
      return {
        kind: kindFromCode(Number(data.current?.weather_code ?? 3)),
        tempC: Number(data.current?.temperature_2m ?? 0),
        tminC: data.daily?.temperature_2m_min?.[0] ?? null,
        tmaxC: data.daily?.temperature_2m_max?.[0] ?? null,
        rainProb: data.daily?.precipitation_probability_max?.[0] ?? null,
      };
    },
  });
}
