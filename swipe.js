var _ = require('lodash');
var React = require("react/addons");

module.exports = React.createClass({
    displayName: "Swipe",

    getDefaultProps: function() {
        return {
            startSlide: 0,
            speed: 300,
            continuous: false,
            edgeFlick: true
        };
    },

    getInitialState: function() {
        return {
            index: this.props.startSlide,
            slideStyle: new Array(this.props.children.length),
            slidePos: new Array(this.props.children.length),
            totalWidth: 0
        };
    },

    componentDidMount: function() {
        this.setup();
        window.addEventListener('resize', this.setup, false);
    },

    setup: function() {
        var defaultWidth = this.getDOMNode().getBoundingClientRect().width;
        var totalWidth = 0;

        // Styling slides
        var slideStyle = this.state.slideStyle;
        this.props.children.map(function(slide, i) {
            var width;
            if (!slide.props.style.width)
                width = defaultWidth + 'px';
            else
                width = slide.props.style.width;
            totalWidth += parseInt(width.slice(0, -2));

            slideStyle[i] = {width: width, position: "absolute", height: "100%"}
        });

        this.setState({slideStyle: slideStyle, totalWidth: (totalWidth + 'px')}, function() {
            // Positioning slides
            for(var i = 0; i < slideStyle.length; i++)
                this.move(i, this.state.index > i ? -slideStyle[i].width.slice(0, -2) : (this.state.index < i ? slideStyle[this.state.index].width.slice(0, -2) : 0), 0);

            // Special positioning if continuous
            if (this.props.continuous) {
                this.move(this.circle(this.state.index - 1), -slideStyle[this.circle(this.state.index - 1)].width.slice(0, -2), 0);
                this.move(this.circle(this.state.index + 1), slideStyle[this.state.index].width.slice(0, -2), 0);
            }

            this.getDOMNode().addEventListener('pointerdown', this.onTouchDown);
        });
    },

    prev: function() {
        if(this.props.continuous || this.state.index > 0)
            this.slide(this.state.index - 1);
    },

    next: function() {
        if (this.props.continuous || this.state.index < this.props.children.length - 1)
            this.slide(this.state.index + 1);
    },

    circle: function(index) {
        var slidesNumber = this.props.children.length;
        return (slidesNumber + (index % slidesNumber)) % slidesNumber;
    },

    slide: function(to) {
        // do nothing if already on requested slide
        if (this.state.index == to)
            return;

        var direction = Math.abs(this.state.index - to) / (this.state.index - to); // 1: backward, -1: forward

        // get the actual position of the slide
        if (this.props.continuous) {
            var natural_direction = direction;
            direction = -this.state.slidePos[this.circle(to)] / this.state.slideStyle[this.circle(to)].width.slice(0, -2);

            // if going forward but to < index, use to = slides.length + to
            // if going backward but to > index, use to = -slides.length + to
            if (direction !== natural_direction)
                to =  -direction * slides.length + to;
        }

        var diff = Math.abs(this.state.index - to) - 1;
        var current;

        // Move all the slides between index and to in the right direction
        while (diff > -1) {
            diff--;
            current = this.circle((to > this.state.index ? to : this.state.index) - diff - 1);
            if(direction == 1)
                this.move(current, this.state.slideStyle[this.circle(current + 1)].width.slice(0, -2), 0);
            else
                this.move(current, -this.state.slideStyle[current].width.slice(0, -2), 0);
        }

        to = this.circle(to);
        this.move(to, 0);

        if (this.props.continuous) {
            current = this.circle(to - direction);
            this.move(current, -(this.state.slideStyle[current].width.slice(0, -2) * direction), 0); // We need to get the next in place
        }

        this.setState({index: to});
    },

    move: function(slide, position, speed) {
        this.translate(slide, position, speed == undefined ? this.props.speed : speed);

        var slidePos = this.state.slidePos;
        slidePos[_.findIndex(this.props.children, slide)] = position;
        this.setState({slidePos: slidePos});
    },

    translate: function(slide, position, speed) {
        var slideStyle = _.clone(this.state.slideStyle);

        slideStyle[slide].transitionDuration = speed + 'ms';
        slideStyle[slide].transform = 'translateX(' + position + 'px)';
        slideStyle[slide].webkitTransform = 'translateX(' + position + 'px)';

        this.setState({slideStyle: slideStyle});
    },


    // Event Handling //

    startX: 0,
    deltaX: 0,

    onTouchDown: function (e) {
        console.log('down');
        this.startX = e.clientX;
        this.deltaX = 0;

        window.addEventListener('pointermove', this.onTouchMove);
        window.addEventListener('pointerup', this.onTouchUp);
    },

    onTouchMove: function(e) {
        console.log('move');
        this.deltaX = e.clientX - this.startX;

        var slides = this.props.children;

        // increase resistance if first or last slide
        if (this.props.continuous) { // we don't add resistance at the end
            this.translate(this.circle(this.state.index - 1), this.deltaX + this.state.slidePos[this.circle(this.state.index - 1)], 0);
            this.translate(this.state.index, this.deltaX + this.state.slidePos[this.state.index], 0);
            this.translate(this.circle(this.state.index + 1), this.deltaX + this.state.slidePos[this.circle(this.state.index + 1)], 0);
        }
        else {
            // If slide left from first slide or slide right from last slide
            if (this.state.index != 0 && this.deltaX > 0 || this.state.index == slides.length - 1 && this.deltaX < 0)
                this.deltaX = !this.props.edgeFlick ? 0 : this.deltaX / (Math.abs(this.deltaX) / this.getDOMNode().getBoundingClientRect().width + 1);

            // translate 1:1
            if(this.state.index > 0)
                this.translate(this.state.index - 1, this.deltaX + this.state.slidePos[this.state.index - 1], 0);

            this.translate(this.state.index, this.deltaX + this.state.slidePos[this.state.index], 0);

            if(this.state.index < this.state.slidePos.length - 1)
                this.translate(this.state.index + 1, this.deltaX + this.state.slidePos[this.state.index + 1], 0);
        }
    },

    onTouchUp: function() {
        console.log('up');
        var slides = this.props.children;
        var isValidSlide = Math.abs(this.deltaX) > 30;
        var isPastBounds =
            this.state.index == 0 && this.deltaX > 0                        // if first slide and slide amt is greater than 0
            || this.state.index == slides.length - 1 && this.deltaX < 0     // or if last slide and slide amt is less than 0
            || !this.props.continuous;                                      // Can't be past bounds when continuous

        var direction = this.deltaX < 0; // true: right, false: left

        var next;
        var prev;
        var prevC;

        if (isValidSlide && !isPastBounds) {
            if (direction) {
                next = this.circle(this.state.index + 1);
                prev = this.circle(this.state.index - 1);
                prevC = this.circle(this.state.index + 2);
            } else {
                next = this.circle(this.state.index - 1);
                prev = this.circle(this.state.index + 1);
                prevC = this.circle(this.state.index - 2);
            }

            this.move(prev, -this.state.slideStyle[prev].width.slice(0, -2), 0);
            if (this.props.continuous)
                this.move(prevC, this.state.slideStyle[prevC].width.slice(0, -2), 0);

            this.move(this.state.index, this.state.slidePos[this.state.index] - this.state.slideStyle[this.state.index].width.slice(0, -2));

            this.move(next, this.state.slidePos[next] - this.state.slideStyle[next].width.slice(0, -2));

            this.setState({index: next});
        }
        else {
            if (this.props.continuous) {
                next = this.circle(this.state.index + 1);
                prev = this.circle(this.state.index - 1);
            } else {
                next = this.state.index + 1;
                prev = this.state.index - 1;
            }

            if(prev >= 0)
                this.move(prev, -this.state.slideStyle[prev].width.slice(0, -2));

            this.move(this.state.index, 0);

            if(next < this.state.slidePos.length)
                this.move(next, this.state.slideStyle[next].width.slice(0, -2));
        }

        this.startX = 0;

        window.removeEventListener('pointermove', this.onTouchMove);
        window.removeEventListener('pointerup', this.onTouchUp);
    },

    componentWillUnmount: function() {
        window.removeEventListener('resize', this.resize, false);
        this.getDOMNode().removeEventListener('pointerdown', this.onTouchDown);
    },

    render: function() {
        var containerStyle = this.props.style ? _.clone(this.props.style) : {};
        containerStyle.overflow = "hidden";
        containerStyle.position = "relative";

        var wrapperStyle = {
            overflow: "hidden",
            position: "relative",
            height: "100%",
            width: this.state.totalWidth
        };

        var base = this;
        return React.DOM.div(
            {className: this.props.className, style: containerStyle},
            React.DOM.div(
                {
                    style: wrapperStyle,
                    ref: "element"
                },
                React.Children.map(this.props.children, function(child, i) {
                    return React.addons.cloneWithProps(child, {style: base.state.slideStyle[i]});
                })
            )
        );
    }
});