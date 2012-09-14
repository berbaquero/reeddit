# Reeddit

Cliente elástico, minimalista y sólo-lectura de [Reddit](http://reddit.com/), que permite la creación de canales personalizados basados en uno o más subreddits.

## Herramientas

Para construir Reeddit, utilicé varios scripts geniales:

*	[Zepto.js](http://zeptojs.com/) -- básicamente, jQuery para navegadores modernos. Más ligero, y con varias ventajas para sitios y apps móviles.
*	[Tappable](https://github.com/cheeaun/tappable) -- Tremendo manejador de eventos 'tap' para móviles.
*	[pagedown](http://code.google.com/p/pagedown/) -- Para convertir texto en Markdown a HTML.
*	[Mustache.js](https://github.com/janl/mustache.js/) -- Templates del lado del cliente. Indispensable.
*	[reziseend.js](https://github.com/porada/resizeend) -- Mejor manejo de eventos de resize.

### Compatibilidad

Por ahora, debería funcionar bien en un browser decente basado en Webkit (Chrome y Safari, desktop y mobile).

Mi intención original fue crear una webapp optimizada para iOS 5 - que desde esa versión tiene manejo de scrolling nativo para contenido con overflow, a través de `-webkit-overflow-scrolling: touch`.

Sin embargo, hasta donde he podido probar, también se puede usar en Android 4+.

En el escritorio, es genial usarla como [Application Shortcut](http://support.google.com/chrome/bin/answer.py?hl=en-GB&answer=95710) en Google Chrome, o como una App en Mac, gracias a [Fluid](http://fluidapp.com/). :D
