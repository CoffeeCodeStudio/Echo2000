

## Profil-layout mobil — bättre ordning

### Problem
På mobil (`grid-cols-1`) renderas alla 11 profilfält i en enda kolumn utan visuell gruppering. Det blir en lång, ostrukturerad lista som är svår att scanna.

### Lösning
Förbättra mobilupplevelsen genom:

1. **ProfileFieldsGrid** — ändra grid från `grid-cols-1 sm:grid-cols-2 md:grid-cols-4` till `grid-cols-2 sm:grid-cols-2 md:grid-cols-4` så att fälten visas i två kolumner även på mobil. Minska gap och textstorlek på mobil.

2. **ProfileInfoSection** — minska padding på mobil (`p-2 sm:p-4`), komprimera avstånd mellan avatar och info.

3. **ProfileBasicInfo** — gör info-raden mer kompakt på mobil med tätare spacing.

4. **ProfileLookingFor** — minska top-margin på mobil (`mt-2 sm:mt-4`).

### Tekniska ändringar

| Fil | Ändring |
|-----|---------|
| `ProfileFieldsGrid.tsx` | `grid-cols-2 sm:grid-cols-2 md:grid-cols-4` + `gap-x-3 gap-y-1 text-xs sm:text-sm` |
| `ProfileInfoSection.tsx` | `p-2 sm:p-4`, `gap-3 sm:gap-6`, `mb-2 sm:mb-4` |
| `ProfileBasicInfo.tsx` | `mb-2 sm:mb-4` |
| `ProfileLookingFor.tsx` | `mt-2 sm:mt-4` |

