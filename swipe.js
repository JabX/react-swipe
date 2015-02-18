var _ = require('lodash');
var React = require("react/addons");

require('./hand')();

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
            slides: new Array(this.props.children.length), // Actual style of slides
            width: 0,
            totalWidth: 0
        };
    },

    componentDidMount: function() {
        this.setup();
        window.addEventListener('resize', this.setup, false);
    },
    
    componentDidUpdate: function() {
        if(this.props.children.length != this.slides.length)
            this.setup();
    },
    
    setup: function() {
        if (!this.isMounted())
            return;

        var index = Math.min(this.props.children.length - 1, this.props.startSlide);
        var defaultWidth = this.getDOMNode().getBoundingClientRect().width;
        var totalWidth = 0;

        this.slides = [];

        var that = this;
        this.props.children.map(function (slide, i) {
            var width;
            if (slide.props.style && slide.props.style.width)
                width = parseInt(slide.props.style.width);
            else
                width = defaultWidth;
            totalWidth += width;

            that.slides.push({width: width});
        });

        this.setState({index: index, width: defaultWidth, totalWidth: totalWidth});

        // Positioning slides
        for (var i = 0; i < this.slides.length; i++)
            this.move(i, this.props.startSlide > i ?  this.slides[i].width : (index < i ? this.slides[index].width : 0), 0);

        // Special positioning if continuous
        if(this.props.continuous) {
            this.move(this.getIndex(index - 1),  this.slides[this.getIndex(index - 1)].width, 0);
            this.move(this.getIndex(index + 1), this.slides[index].width, 0);
        }

        this.updateSlides();

        this.getDOMNode().addEventListener('pointerdown', this.onTouchDown);
        this.getDOMNode().addEventListener('pointercancel', this.disable, false);
    },

    disable: function() {
        this.isScrolling = true;
    },

    prev: function() {
        this.slide(this.state.index - 1);
    },

    next: function() {
        this.slide(this.state.index + 1);
    },

    getIndex: function(index) {
        var slidesNumber = this.slides.length;
        if(this.props.continuous)
            return (slidesNumber + (index % slidesNumber)) % slidesNumber;
        else {
            if(index < 0) return 0;
            else if (index >= slidesNumber - 1) return slidesNumber - 1;
            else return index;
        }
    },

    slide: function(to) {
        // Do nothing if already on requested slide

        if (this.state.index == this.getIndex(to))
            return;

        var direction = -Math.abs(this.state.index - to) / (this.state.index - to);

        // Place all slides at the right position
        var totalWidth = 0;
        var current = this.state.index;

        while(current <= to && direction == 1 || current >= to && direction == -1) {
            this.move(this.getIndex(current), totalWidth, 0);
            if (direction == 1) {
                totalWidth += this.slides[this.getIndex(current)].width;
                current++;
            } else {
                current--;
                totalWidth -= this.slides[this.getIndex(current)].width;
            }
        }

        var base = this;
        this.updateSlides(function() {
            setTimeout(function () {
                // Move all slides
                current = base.state.index;
                while (current <= to && direction == 1 || current >= to && direction == -1) {
                    if (direction == 1) {
                        base.move(base.getIndex(current), base.slides[base.getIndex(current)].transform - totalWidth + base.slides[base.getIndex(to)].width);
                        current++;
                    } else {
                        base.move(base.getIndex(current), base.slides[base.getIndex(current)].transform - totalWidth - base.slides[base.getIndex(to)].width);
                        current--;
                    }
                }

                base.setState({index: base.getIndex(to)});
                base.updateSlides();
            }, 50);
        });
    },

    move: function(slide, position, speed) {
        this.slides[slide].transitionDuration = (speed == undefined ? this.props.speed : speed);
        this.slides[slide].transform = position;
    },

    updateSlides: function(callback) {
        var newSlides = [];
        for(var i = 0; i < this.slides.length; i++) {
            var newSlide = {};
            newSlide.msUserSelect = "none";
            newSlide.WebkitUserSelect = "none";
            newSlide.MozUserSelect = "none";
            newSlide.position = "absolute";
            newSlide.height = "100%";
            newSlide.width = this.slides[i].width + "px";
            newSlide.transitionDuration = this.slides[i].transitionDuration + 'ms';
            newSlide.transform = 'translateX(' + this.slides[i].transform + 'px)';
            newSlide.webkitTransform = 'translateX(' + this.slides[i].transform + 'px)';
            newSlides.push(newSlide);
        }

        this.setState({slides: newSlides}, callback);
    },

    // Event Handling //

    start: {x: 0},
    delta: {x: 0},
    activeSlides: [],
    leftWidth: 0,
    rightWidth: 0,
    isScrolling: false,

    onTouchDown: function (e) {
        if (e.isPrimary == false)
            return;

        this.activeSlides = [];
        this.leftWidth = 0;
        this.rightWidth = 0;
        this.start.x = e.clientX;
        this.delta.x = 0;
        this.isScrolling = false;

        var slideIndex = this.state.index;
        var i;

        do {
            i = this.getIndex(slideIndex);
            this.activeSlides.push(i);
            this.rightWidth += this.slides[i].width;
            slideIndex++;
        } while(this.rightWidth < this.state.width * 2 && (this.props.continuous ? true : (slideIndex < this.state.slides.length)));

        slideIndex = this.state.index - 1;

        while(this.leftWidth < this.state.width && (this.props.continuous ? true : (slideIndex > -1))) {
            i = this.getIndex(slideIndex);
            this.activeSlides.unshift(i);
            this.leftWidth += this.slides[i].width;
            slideIndex--;
        }

        var base = this;
        this.activeSlides.map(function(i) {
            base.activeWidth += base.slides[i].width;
        });

        window.addEventListener('pointermove', this.onTouchMove, false);
        window.addEventListener('pointerup', this.onTouchUp, false);
    },

    onTouchMove: function(e) {
        if (this.isScrolling || e.isPrimary == false)
            return;
            
        e.preventDefault(); // Android fix
        
        this.delta.x = e.clientX - this.start.x;

        if (
            this.delta.x < -(this.rightWidth - this.state.width)
            || this.delta.x > this.leftWidth
        )
            this.delta.x = this.props.edgeFlick ?
                (this.delta.x > 0 ? this.delta.x = this.leftWidth + Math.pow(this.delta.x - this.leftWidth, 0.7) :
                    this.delta.x = -((this.rightWidth - this.state.width) + Math.pow(-this.delta.x - this.rightWidth + this.state.width, 0.7)))
                : (this.delta.x > 0 ? this.leftWidth : -(this.rightWidth - this.state.width));


        var base = this;
        var index = _.findIndex(this.activeSlides, function (i) {
            return i == base.state.index;
        });

        var i;
        var diff = 0;
        var slide;

        for (i = index; i < this.activeSlides.length; i++) {
            slide = this.activeSlides[i];
            this.move(slide, this.delta.x + diff, 0);
            diff += this.slides[slide].width;
        }

        diff = 0;
        for (i = index - 1; i >= 0; i--) {
            slide = this.activeSlides[i];
            diff += this.slides[slide].width;
            this.move(slide, this.delta.x - diff, 0);
        }

        this.updateSlides();
    },

    onTouchUp: function(e, cancel) {
        if (this.isScrolling || e.isPrimary == false)
            return;

        var isValidSlide = Math.abs(this.delta.x) > 30;
        var isPastBounds =
            (this.state.index == 0 && this.delta.x > 0                        // if first slide and slide amt is greater than 0
            || this.state.index == this.props.children.length - 1 && this.delta.x < 0 )    // or if last slide and slide amt is less than 0
            && !this.props.continuous;                                      // Can't be past bounds when continuous

        var direction = this.delta.x < 0 ? 1 : -1;

        var newIndex = isValidSlide && !isPastBounds && !cancel ? this.getIndex(this.state.index + direction) : this.state.index;

        this.setState({index: newIndex}, function() {
            var base = this;
            var index = _.findIndex(this.activeSlides, function(i) { return i == base.state.index; });

            var i;
            var diff = 0;
            var slide;

            for (i = index; i < this.activeSlides.length; i++) {
                slide = this.activeSlides[i];
                this.move(slide, diff);
                diff += this.slides[slide].width;
            }

            diff = 0;
            for (i = index - 1; i >= 0; i--) {
                slide = this.activeSlides[i];
                diff += this.slides[slide].width;
                this.move(slide, -diff);
            }

            this.updateSlides();
        });

        this.start.x = 0;

        window.removeEventListener('pointermove', this.onTouchMove);
        window.removeEventListener('pointerup', this.onTouchUp);
    },

    componentWillUnmount: function() {
        window.removeEventListener('resize', this.resize, false);
        this.getDOMNode().removeEventListener('pointerdown', this.onTouchDown);
        this.getDOMNode().removeEventListener('pointercancel', this.disable, false);
    },

    render: function() {
        var containerStyle = this.props.style ? _.clone(this.props.style) : {};
        containerStyle.overflow = "hidden";
        containerStyle.position = "relative";
        containerStyle.touchAction = "pan-y";

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
                    return React.addons.cloneWithProps(child, {style: base.state.slides[i]});
                })
            )
        );
    }
});
