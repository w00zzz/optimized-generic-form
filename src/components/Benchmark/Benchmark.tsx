import { Profiler, useCallback, useRef, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// Tipos para el Profiler
type ProfilerPhase = 'mount' | 'update' | 'nested-update';

interface Metric {
  id: string;
  phase: ProfilerPhase;
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: Set<unknown>;
  timestamp: number;
}

// Interfaces para estadísticas agregadas
interface MetricStats {
  count: number;
  avgActualDuration: number;
  avgBaseDuration: number;
  avgRatio: number;
  totalRenders: number;
  mountCount: number;
  updateCount: number;
  nestedUpdateCount: number;
  lastUpdated: number;
}

interface BenchmarkProps {
  children: ReactNode;
  componentId?: string;
  maxMetrics?: number;
}

export const Benchmark = ({ 
  children, 
  componentId = 'ComponentUnderTest',
  maxMetrics = 5 
}: BenchmarkProps) => {
  // Estado para mostrar estadísticas en la UI
  const [stats, setStats] = useState<Record<string, MetricStats>>({});
  
  // Referencia para almacenar métricas sin causar re-renders
  const metricsRef = useRef<Metric[]>([]);
  
  // Flag para saber si podemos actualizar de forma segura
  const isUpdatingRef = useRef<boolean>(false);
  
  // Flag para controlar si seguimos recolectando métricas
  const stopCollectingRef = useRef<boolean>(false);
  
  // Función para calcular estadísticas de las métricas
  const calculateStats = useCallback(() => {
    const metrics = metricsRef.current;
    if (metrics.length === 0) return {};
    
    // Agrupar métricas por ID de componente
    const statsByComponent: Record<string, MetricStats> = {};
    
    metrics.forEach(metric => {
      if (!statsByComponent[metric.id]) {
        statsByComponent[metric.id] = {
          count: 0,
          avgActualDuration: 0,
          avgBaseDuration: 0,
          avgRatio: 0,
          totalRenders: 0,
          mountCount: 0,
          updateCount: 0,
          nestedUpdateCount: 0,
          lastUpdated: 0
        };
      }
      
      const stats = statsByComponent[metric.id];
      
      // Incrementar contadores
      stats.count++;
      stats.totalRenders++;
      stats.lastUpdated = Date.now();
      
      // Actualizar promedios (fórmula incremental)
      const oldWeight = (stats.count - 1) / stats.count;
      const newWeight = 1 / stats.count;
      
      stats.avgActualDuration = stats.avgActualDuration * oldWeight + metric.actualDuration * newWeight;
      stats.avgBaseDuration = stats.avgBaseDuration * oldWeight + metric.baseDuration * newWeight;
      stats.avgRatio = stats.avgRatio * oldWeight + (metric.actualDuration / metric.baseDuration) * newWeight;
      
      // Contar por tipo de fase
      if (metric.phase === 'mount') stats.mountCount++;
      else if (metric.phase === 'update') stats.updateCount++;
      else if (metric.phase === 'nested-update') stats.nestedUpdateCount++;
    });
    
    return statsByComponent;
  }, []);
  
  // UseEffect para actualizar las estadísticas periódicamente
  useEffect(() => {
    // Configurar un intervalo para actualizar los promedios
    const intervalId = setInterval(() => {
      if (metricsRef.current.length > 0 && !isUpdatingRef.current) {
        isUpdatingRef.current = true;
        setStats(calculateStats());
        isUpdatingRef.current = false;
      }
    }, 500); // Actualizamos cada 500ms

    return () => clearInterval(intervalId);
  }, [calculateStats]);
  
  // Create a stable callback function that won't change on re-renders
  const onRenderCallback = useCallback(
    (
      id: string, 
      phase: ProfilerPhase, 
      actualDuration: number, 
      baseDuration: number, 
      startTime: number, 
      commitTime: number, 
      interactions: Set<unknown>
    ) => {
      // Si ya hemos recolectado suficientes métricas, no hacemos nada más
      if (stopCollectingRef.current) {
        return;
      }
      
      // Record all the metric data that React Profiler proporciona
      const newMetric: Metric = {
        id,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
        interactions,
        timestamp: Date.now(),
      };
      
      // Añadir la nueva métrica a la colección
      metricsRef.current.push(newMetric);
      
      // Si llegamos al máximo de métricas, detenemos la recolección
      if (metricsRef.current.length >= maxMetrics) {
        stopCollectingRef.current = true;
        console.log(`Se alcanzó el límite de ${maxMetrics} métricas. Deteniendo la recolección.`);
      }
    },
    [maxMetrics]
  );
  
  // Función para limpiar métricas y reiniciar la recolección (para el botón)
  const clearMetrics = useCallback(() => {
    metricsRef.current = [];
    setStats({});
    stopCollectingRef.current = false;
  }, []);

  return (
    <>
      <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
        <h1>Benchmark de Rendimiento</h1>
        
        {/* Siempre usamos el Profiler para recolectar métricas en tiempo real */}
        <Profiler 
          id={componentId} 
          // @ts-ignore: Desactivamos la comprobación para evitar errores con el tipo ProfilerOnRenderCallback
          onRender={onRenderCallback}
        >
          <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
            {children}
          </div>
        </Profiler>

        <div style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '0.8rem' }}>
            <button 
              onClick={clearMetrics} 
              style={{ padding: '5px 10px' }}
            >
              Limpiar Estadísticas
            </button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
            <caption style={{ marginBottom: '8px', fontWeight: 'bold' }}>
              Componentes analizados: {Object.keys(stats).length} | Métricas recolectadas: {metricsRef.current.length}
            </caption>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Componente</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Renderizados</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Duración Promedio (ms)</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Duración Base (ms)</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Ratio</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Mount</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Update</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Nested</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats).map(([id, stat]) => (
                <tr key={id}>
                  <td style={{ border: '1px solid #eee', padding: '8px', fontWeight: 'bold' }}>{id}</td>
                  <td style={{ border: '1px solid #eee', padding: '8px' }}>{stat.totalRenders}</td>
                  <td style={{ border: '1px solid #eee', padding: '8px' }}>{stat.avgActualDuration.toFixed(3)}</td>
                  <td style={{ border: '1px solid #eee', padding: '8px' }}>{stat.avgBaseDuration.toFixed(3)}</td>
                  <td style={{ border: '1px solid #eee', padding: '8px' }}>{stat.avgRatio.toFixed(3)}</td>
                  <td style={{ border: '1px solid #eee', padding: '8px' }}>{stat.mountCount}</td>
                  <td style={{ border: '1px solid #eee', padding: '8px' }}>{stat.updateCount}</td>
                  <td style={{ border: '1px solid #eee', padding: '8px' }}>{stat.nestedUpdateCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '8px', fontSize: '0.9em' }}>
        <h3 style={{ marginTop: 0 }}>Leyenda: Explicación de las métricas</h3>
        
        <dl style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '0.5rem' }}>
          <dt style={{ fontWeight: 'bold' }}>Componente:</dt>
          <dd>Nombre del componente React analizado por el Profiler.</dd>
          
          <dt style={{ fontWeight: 'bold' }}>Renderizados:</dt>
          <dd>Número total de veces que el componente ha sido renderizado.</dd>
          
          <dt style={{ fontWeight: 'bold' }}>Duración Promedio:</dt>
          <dd>Tiempo promedio en milisegundos que tomó realizar el renderizado real del componente (actualDuration). Representa el tiempo de renderizado efectivo.</dd>
          
          <dt style={{ fontWeight: 'bold' }}>Duración Base:</dt>
          <dd>Tiempo estimado en milisegundos que tomaría renderizar el componente sin memoización (baseDuration). Es un valor de referencia calculado por React.</dd>
          
          <dt style={{ fontWeight: 'bold' }}>Ratio:</dt>
          <dd>Relación entre la duración real y la duración base. Un valor mayor que 1 (rojo) indica que el renderizado tomó más tiempo del esperado. Un valor menor que 1 (verde) indica una buena optimización.</dd>
          
          <dt style={{ fontWeight: 'bold' }}>Mount:</dt>
          <dd>Número de veces que el componente fue montado por primera vez. Normalmente solo ocurre una vez, a menos que el componente se elimine y vuelva a añadir al DOM.</dd>
          
          <dt style={{ fontWeight: 'bold' }}>Update:</dt>
          <dd>Número de veces que el componente fue re-renderizado debido a cambios en props, estado o contexto.</dd>
          
          <dt style={{ fontWeight: 'bold' }}>Nested:</dt>
          <dd>Número de veces que el componente fue re-renderizado porque un componente padre fue re-renderizado, aunque sus propias props no cambiaron.</dd>
        </dl>

        <div style={{ marginTop: '1rem', padding: '0.75rem', borderLeft: '4px solid rgb(70, 70, 69)', borderRadius: '4px' }}>
          <strong>Nota:</strong> Se recolectan exactamente 5 métricas antes de detener la captación de datos. Haz clic en "Limpiar Estadísticas" para reiniciar la captación. Estos valores son aproximados y pueden variar dependiendo de la carga del sistema.
        </div>
      </div>
    </>
  );
};

export default Benchmark;
