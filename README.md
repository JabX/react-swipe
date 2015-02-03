react-swipe
===========

[Brad Birdsall](https://github.com/thebird)'s [swipe.js](http://swipejs.com), as a [React](http://facebook.github.io/react) component.

This is very different from the initial project I forked, because I have rewriten everything from the ground up as a React component, instead of simply binding the exisiting library to React.

Not everything has been ported (essentially features I had no use for, like callbacks or older browser support), but in the meantime I've done three big changes :
- Touch events use the PointerEvent interface (native on IE and Firefox and emulated on the others with Hand.js), so that it can be used with independently with touch and mouse on every browser.
- Edge sliding can be removed with the ```edgeFlick={false}``` prop.
- Slides can now have a fixed width, instead of always inherit the container width. Specify a width in the style prop of your slide.

Installation
------------

Not available on npm yet, but you can still install it with ```npm install```, pointing on this repo.

Usage
-----

```javascript
var React = require("react")
var Swipe = require("react-swipe")

var carousel = (
    <Swipe>
        <div>Item 1</div>
        <div>Item 2</div>
        <div style={{width: 100px}}>Item 3</div>
    </Swipe>
);

React.render(carousel, document.body)
```

It is still very experimental and not every use case has been tested (see example). Feel free to report any bug you encounter or contribute.
