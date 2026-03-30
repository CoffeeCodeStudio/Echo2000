

## Klotter mobilprecision — fix

### Problem
Canvas-storleken sätts bara vid `window.resize` och initial mount. På mobil ändras containerns storlek ofta utan att `window.resize` triggas (t.ex. vid tab-byte draw↔gallery, toolbar-ändringar). Då blir `getBoundingClientRect()` i `getPointerPosition` korrekt men `canvas.width/height` är inaktuella — koordinaterna mappas fel och pennan hamnar offset från fingret.

### Lösning
Byt `window.addEventListener("resize", ...)` mot en `ResizeObserver` på canvas-elementet. Lägg även till `activeTab` som dependency så canvas kalibreras direkt vid tab-byte.

### Tekniska ändringar

| Fil | Ändring |
|-----|---------|
| `src/hooks/useKlotterCanvas.ts` | Ersätt resize-effecten (rad 136–153): använd `ResizeObserver` på `canvasRef.current` istället för `window` resize-event. Lägg till `activeTab` i dependency-arrayen så att canvas storleksanpassas korrekt vid tab-byte. |

**Ny resize-effect (pseudokod):**
```ts
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    redrawFromRefs();
  };

  resizeCanvas();

  const ro = new ResizeObserver(() => resizeCanvas());
  ro.observe(canvas);
  return () => ro.disconnect();
}, [redrawFromRefs, activeTab]);
```

En enda fil, en enda effect — löser offset-problemet på mobil.

