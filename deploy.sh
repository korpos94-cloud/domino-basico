#!/bin/bash

echo "🚀 Desplegando Dominó a GitHub Pages..."

# Asegurarse de estar en la rama correcta
git checkout claude/domino-game-complete-Y3RZn

# Push a origin
git push -u origin claude/domino-game-complete-Y3RZn

echo ""
echo "✅ Código subido exitosamente"
echo ""
echo "📱 Pasos finales:"
echo "1. Ve a: https://github.com/korpos94-cloud/domino-basico/settings/pages"
echo "2. En 'Source', selecciona: claude/domino-game-complete-Y3RZn"
echo "3. Haz clic en 'Save'"
echo "4. Espera 2-3 minutos"
echo "5. Tu juego estará en: https://korpos94-cloud.github.io/domino-basico/"
echo ""
echo "📲 Desde tu Android:"
echo "   → Abre Chrome y ve a la URL"
echo "   → Toca el botón 'Instalar' cuando aparezca"
echo "   → ¡Juega desde tu pantalla de inicio!"
echo ""
