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

    goto1: function() {
        this.refs.swipe1.slide(0);
        this.refs.swipe2.slide(0);
    },

    goto3: function() {
        this.refs.swipe1.slide(2);
        this.refs.swipe2.slide(2);
    },

    render: function() {
       var height = {height: "200px"};
       var style01 = {background: "blue"};
       var style02 = {background: "red"};
       var style03 = {background: "green"};
       var style11 = {background: "blue", width: "150px"};
       var style12 = {background: "green"};

        return (
           <div>
               <button onClick={this.next}>NEXT</button>
               <button onClick={this.prev}>PREV</button>
               <button onClick={this.goto3}>GO TO 3</button>
               <button onClick={this.goto1}>GO TO 1</button>
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
               <Swipe style={height} startSlide={1} edgeFlick={false} ref="swipe3">
                   <h1 style={style11}>FIRST</h1>
                   <h1 style={style12}>SECOND</h1>
               </Swipe>
           </div>
        );
    }
});

React.render(<Examples />, document.body);