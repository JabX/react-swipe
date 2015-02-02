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
            slides: new Array(this.props.children.length),
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
        var slides = this.state.slides;
        this.props.children.map(function(slide, i) {
            var width;
            if (!slide.props.style.width)
                width = defaultWidth;
            else
                width = parseInt(slide.props.style.width);
            totalWidth += width;

            slides[i] = {width: width, position: "absolute", height: "100%"};
        });

        this.setState({slides: slides, width: defaultWidth, totalWidth: totalWidth}, function() {
            // Positioning slides
            for(var i = 0; i < slides.length; i++)
                this.move(i, this.state.index > i ? -slides[i].width : (this.state.index < i ? slides[this.state.index].width : 0), 0);

            // Special positioning if continuous
            if (this.props.continuous) {
                this.move(this.getIndex(this.state.index - 1), -slides[this.getIndex(this.state.index - 1)].width, 0);
                this.move(this.getIndex(this.state.index + 1), slides[this.state.index].width, 0);
            }

            this.getDOMNode().addEventListener('pointerdown', this.onTouchDown);
        });
    },

    prev: function() {
        this.slide(this.state.index - 1);
    },

    next: function() {
        this.slide(this.state.index + 1);
    },

    getIndex: function(index) {
        var slidesNumber = this.state.slides.length;

        if(this.props.continuous)
            return (slidesNumber + (index % slidesNumber)) % slidesNumber;
        else {
            if(index < 0) return 0;
            else if (index >= slidesNumber - 1) return slidesNumber - 1;
            else return index;
        }
    },

    getPos: function(index) {
        var value = this.state.slides[this.getIndex(index)].transform;
        return parseInt(value.substring(11, value.length - 3));
    },

    slide: function(to) {
        // Do nothing if already on requested slide
        if (this.state.index == this.getIndex(to))
            return;

        var direction = -Math.abs(this.state.index - to) / (this.state.index - to);

        // Place all slides at the right position
        var totalWidth = 0;
        var current = this.state.index;

        var slidePos = {};

        while(current <= to && direction == 1 || current >= to && direction == -1) {
            this.move(this.getIndex(current), totalWidth, 0);

            if (direction == 1) {
                totalWidth += this.state.slides[this.getIndex(current)].width;
                current++;
            } else {
                current--;
                totalWidth -= this.state.slides[this.getIndex(current)].width;
            }
        }

        // Move all slides
        current = this.state.index;
        while(current <= to && direction == 1 || current >= to && direction == -1) {
            if(direction == 1) {
                this.move(this.getIndex(current), this.getPos(current) - this.state.slides[this.getIndex(current - 1)].width);
                current++;
            } else {
                this.move(this.getIndex(current), this.getPos(current) + this.state.slides[this.getIndex(current - 1)].width);
                current--;
            }
        }

        this.setState({index: this.getIndex(to)});
    },

    move: function(slide, position, speed) {
        var slides = _.clone(this.state.slides);

        slides[slide].transitionDuration = (speed == undefined ? this.props.speed : speed).toString() + 'ms';
        slides[slide].transform = 'translateX(' + position.toString() + 'px)';
        slides[slide].webkitTransform = 'translateX(' + position.toString() + 'px)';

        this.setState({slides: slides});
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
            this.rightWidth += this.state.slides[i].width;
            slideIndex++;
        } while(this.rightWidth < this.state.width * 2 && (this.props.continuous ? true : (slideIndex < this.state.slides.length)));

        slideIndex = this.state.index - 1;

        while(this.leftWidth < this.state.width && (this.props.continuous ? true : (slideIndex > -1))) {
            i = this.getIndex(slideIndex);
            this.activeSlides.unshift(i);
            this.leftWidth += this.state.slides[i].width;
            slideIndex--;
        }

        var base = this;
        this.activeSlides.map(function(i) {
            base.activeWidth += base.state.slides[i].width;
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
            this.move(slide, this.deltaX + diff, 0);
            diff += this.state.slides[slide].width;
        }

        diff = 0;
        for (i = index - 1; i >= 0; i--) {
            slide = this.activeSlides[i];
            diff += this.state.slides[slide].width;
            this.move(slide, this.deltaX - diff, 0);
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
                diff += this.state.slides[slide].width;
            }

            diff = 0;
            for (i = index - 1; i >= 0; i--) {
                slide = this.activeSlides[i];
                diff += this.state.slides[slide].width;
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
                    var style = _.clone(base.state.slides[i]);
                    if(style)
                        if(style.width)
                            style.width += 'px';
                    return React.addons.cloneWithProps(child, {style: style});
                })
            )
        );
    }
});