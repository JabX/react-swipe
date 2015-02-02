var _ = require('lodash');
var React = require("react/addons");

module.exports = React.createClass({
    displayName: "Swipe",

    getDefaultProps: function() {
        return {
            startSlide: 0,
            speed: 250,
            continuous: false,
            edgeFlick: true
        };
    },

    getInitialState: function() {
        return {
            index: this.props.startSlide,
            slideStyle: new Array(this.props.children.length),
            slidePos: new Array(this.props.children.length),
            width: 0,
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
                width = defaultWidth;
            else
                width = parseInt(slide.props.style.width);
            totalWidth += width;

            slideStyle[i] = {width: width, position: "absolute", height: "100%"};
        });

        this.setState({slideStyle: slideStyle, width: defaultWidth, totalWidth: totalWidth}, function() {
            // Positioning slides
            for(var i = 0; i < slideStyle.length; i++)
                this.move(i, this.state.index > i ? -slideStyle[i].width : (this.state.index < i ? slideStyle[this.state.index].width : 0), 0);

            // Special positioning if continuous
            if (this.props.continuous) {
                this.move(this.getIndex(this.state.index - 1), -slideStyle[this.getIndex(this.state.index - 1)].width, 0);
                this.move(this.getIndex(this.state.index + 1), slideStyle[this.state.index].width, 0);
            }

            this.getDOMNode().addEventListener('pointerdown', this.onTouchDown);
        });
    },

    prev: function() {
        this.slide(this.getIndex(this.state.index - 1));
    },

    next: function() {
        this.slide(this.getIndex(this.state.index + 1));
    },

    getIndex: function(index) {
        var slidesNumber = this.state.slidePos.length;

        if(this.props.continuous)
            return (slidesNumber + (index % slidesNumber)) % slidesNumber;
        else {
            if(index < 0) return 0;
            else if (index >= slidesNumber) return slidesNumber;
            else return index;
        }
    },

    slide: function(to) {
        // do nothing if already on requested slide
        if (this.state.index == to)
            return;

        var direction = Math.abs(this.state.index - to) / (this.state.index - to); // 1: backward, -1: forward

        // get the actual position of the slide
        if (this.props.continuous) {
            var natural_direction = direction;
            direction = -this.state.slidePos[this.getIndex(to)] / this.state.slideStyle[this.getIndex(to)].width;

            // if going forward but to < index, use to = slides.length + to
            // if going backward but to > index, use to = -slides.length + to
            if (direction !== natural_direction)
                to =  -direction * this.state.slideStyle.length + to;
        }

        var diff = Math.abs(this.state.index - to) - 1;
        var current;

        // Move all the slides between index and to in the right direction
        while (diff > -1) {
            diff--;
            current = this.getIndex((to > this.state.index ? to : this.state.index) - diff - 1);
            if(direction == 1)
                this.move(current, this.state.slideStyle[this.getIndex(current + 1)].width, 0);
            else
                this.move(current, -this.state.slideStyle[current].width, 0);
        }

        to = this.getIndex(to);
        this.move(to, 0);

        if (this.props.continuous) {
            current = this.getIndex(to - direction);
            this.move(current, -(this.state.slideStyle[current].width * direction), 0); // We need to get the next in place
        }

        this.setState({index: to});
    },

    move: function(slide, position, speed) {
        this.translate(slide, position, speed == undefined ? this.props.speed : speed);

        var slidePos = _.clone(this.state.slidePos);
        slidePos[slide] = position;
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
    activeSlides: [],
    leftWidth: 0,
    rightWidth: 0,

    onTouchDown: function (e) {
        this.activeSlides = [];
        this.leftWidth = 0;
        this.rightWidth = 0;
        this.startX = e.clientX;
        this.deltaX = 0;

        var slideIndex = this.state.index;
        var i;

        do {
            i = this.getIndex(slideIndex);
            this.activeSlides.push(i);
            this.rightWidth += this.state.slideStyle[i].width;
            slideIndex++;
        } while(this.rightWidth < this.state.width * 2 && (this.props.continuous ? true : (slideIndex < this.state.slidePos.length)));

        slideIndex = this.state.index - 1;

        while(this.leftWidth < this.state.width && (this.props.continuous ? true : (slideIndex > -1))) {
            i = this.getIndex(slideIndex);
            this.activeSlides.unshift(i);
            this.leftWidth += this.state.slideStyle[i].width;
            slideIndex--;
        }

        var base = this;
        this.activeSlides.map(function(i) {
            base.activeWidth += base.state.slideStyle[i].width;
        });

        window.addEventListener('pointermove', this.onTouchMove);
        window.addEventListener('pointerup', this.onTouchUp);
    },

    onTouchMove: function(e) {
        this.deltaX = e.clientX - this.startX;

        // If slide left from first slide or slide right from last slide
        if (
                this.deltaX < -(this.rightWidth - this.state.width)
                || this.deltaX > this.leftWidth
            )
            this.deltaX = this.props.edgeFlick ?
                (this.deltaX > 0 ? this.deltaX = this.leftWidth + Math.pow(this.deltaX - this.leftWidth, 0.7) :
                    this.deltaX = -((this.rightWidth - this.state.width) + Math.pow(-this.deltaX - this.rightWidth + this.state.width, 0.7)))
                : (this.deltaX > 0 ? this.leftWidth : -(this.rightWidth - this.state.width));


        var base = this;
        var index = _.findIndex(this.activeSlides, function(i) { return i == base.state.index; });

        var i;
        var diff = 0;
        var slide;

        for (i = index; i < this.activeSlides.length; i++) {
            slide = this.activeSlides[i];
            this.translate(slide, this.deltaX + diff, 0);
            diff += this.state.slideStyle[slide].width;
        }

        diff = 0;
        for (i = index - 1; i >= 0; i--) {
            slide = this.activeSlides[i];
            diff += this.state.slideStyle[slide].width;
            this.translate(slide, this.deltaX - diff, 0);
        }
    },

    onTouchUp: function() {
        var isValidSlide = Math.abs(this.deltaX) > 30;
        var isPastBounds =
            (this.state.index == 0 && this.deltaX > 0                        // if first slide and slide amt is greater than 0
            || this.state.index == this.props.children.length - 1 && this.deltaX < 0 )    // or if last slide and slide amt is less than 0
            && !this.props.continuous;                                      // Can't be past bounds when continuous

        var direction = this.deltaX < 0 ? 1 : -1;

        var newIndex = isValidSlide && !isPastBounds ? this.getIndex(this.state.index + direction) : this.state.index;

        this.setState({index: newIndex}, function() {
            var base = this;
            var index = _.findIndex(this.activeSlides, function(i) { return i == base.state.index; });

            var i;
            var diff = 0;
            var slide;

            for (i = index; i < this.activeSlides.length; i++) {
                slide = this.activeSlides[i];
                this.move(slide, diff);
                diff += this.state.slideStyle[slide].width;
            }

            diff = 0;
            for (i = index - 1; i >= 0; i--) {
                slide = this.activeSlides[i];
                diff += this.state.slideStyle[slide].width;
                this.move(slide, -diff);
            }
        });

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
        containerStyle.touchAction = "none";

        var wrapperStyle = {
            overflow: "hidden",
            position: "relative",
            height: "100%",
            width: this.state.totalWidth + 'px'
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
                    var style = _.clone(base.state.slideStyle[i]);
                    if(style)
                        if(style.width)
                            style.width += 'px';
                    return React.addons.cloneWithProps(child, {style: style});
                })
            )
        );
    }
});