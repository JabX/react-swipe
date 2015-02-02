var React = require('react/addons');
var Swipe = require('../swipe.js');

var Examples = React.createClass({
    prev: function() {
        this.refs.swipe1.prev();
        this.refs.swipe2.prev();
        this.refs.swipe3.prev();
    },

    next: function() {
        this.refs.swipe1.next();
        this.refs.swipe2.next();
        this.refs.swipe3.next();
    },

    render: function() {
       var height = {height: "200px"};
       var style01 = {background: "blue"};
       var style02 = {background: "red"};
       var style03 = {background: "green"};
       var style11 = {background: "blue", width: "200px"};
       var style12 = {background: "green"};

        return (
           <div>
               <button onClick={this.next}>NEXT</button>
               <button onClick={this.prev}>PREV</button>
               <h1>Regular Swipe</h1>
               <Swipe style={height} ref="swipe1">
                   <h1 style={style01}>FIRST</h1>
                   <h1 style={style02}>SECOND</h1>
                   <h1 style={style03}>THIRD</h1>
               </Swipe>

               <h1>Continous Swipe</h1>
               <Swipe style={height} continuous={true} ref="swipe2">
                   <h1 style={style01}>FIRST</h1>
                   <h1 style={style02}>SECOND</h1>
                   <h1 style={style03}>THIRD</h1>
               </Swipe>

               <h1>Uneven width Swipe</h1>
               <Swipe style={height} startSlide={1} speed={100} edgeFlick={false} ref="swipe3">
                   <h1 style={style11}>FIRST</h1>
                   <h1 style={style12}>SECOND</h1>
               </Swipe>
           </div>
        );
    }
});

React.render(<Examples />, document.body);