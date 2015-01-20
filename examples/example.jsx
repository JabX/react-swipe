var React = require('react/addons');
var Swipe = require('../swipe.js');

var Examples = React.createClass({
   render: function() {
       var height = {height: "200px"};
       var style01 = {background: "blue"};
       var style02 = {background: "red"};
       var style03 = {background: "green"};
       var style11 = {background: "blue", width: "200px"};
       var style12 = {background: "green"};
       return (
           <div>
               <h1>Regular Swipe</h1>
               <Swipe style={height}>
                   <h1 style={style01}>FIRST</h1>
                   <h1 style={style02}>SECOND</h1>
                   <h1 style={style03}>THIRD</h1>
               </Swipe>

               <h1>Continous Swipe</h1>
               <Swipe style={height} continous={true}>
                   <h1 style={style01}>FIRST</h1>
                   <h1 style={style02}>SECOND</h1>
                   <h1 style={style03}>THIRD</h1>
               </Swipe>

               <h1>Uneven width Swipe</h1>
               <Swipe style={height} continous={true}>
                   <h1 style={style11}>FIRST</h1>
                   <h1 style={style12}>SECOND</h1>
               </Swipe>
           </div>
       );
   }
});

React.render(<Examples />, document.body);