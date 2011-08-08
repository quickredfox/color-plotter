###
    You can easily remove these and implement non-native wrapping versions
###
if typeof Array::flatten isnt 'function'
    Array::flatten = ()-> 
        this.reduce (p,n)-> 
            if typeof n isnt "undefined" and n isnt null then p.concat(n) else p
        , []
if typeof Array.cast isnt 'function'
    Array.cast = (args)-> Array::slice.call args
    
###
    A M is short for "Math" class to handle extend Math and shrin the namespace
###   
class M 
    'E LN2 LN10 LOGToE LOG10E PI SQRT1_2 SQRT2'.split(' ').forEach (property)->
        @[property] = Math[ property ]
    , @
    'abs acos asin atan atan2 ceil cos expo floor log max min pow random round sin sqrt tan'.split(' ').forEach (method)->
        @[method] = Math[method]
    , @
    @PI2:     Math.PI*2
    @radToDeg: (r)-> r * ( 180 / Math.PI )
    @degToRad: (d)-> d * ( Math.PI / 180 ) 
    @polarToCartesian: (r,theta)->
        [r,theta] = Array.cast( arguments ).flatten()
        [ 
            r*Math.cos(theta),
            r*Math.sin(theta)
        ]
    @cartesianToPolar: (x,y)->
        [x,y] = Array.cast( arguments ).flatten() 
        [
            Math.sqrt( x*x+y*y )
            Math.atan2 y, x
        ]
###
    A Color class to handle all color conversions 
###   
class Color
    ###
        conversion helpers
    ###
    hueToRgb=( p, q, t )->
        t += 1 if t < 0
        t -= 1 if t > 1
        return p + ( q - p ) * 6 * t if t < 1/6
        return q if t < 1/2
        return p + ( q - p ) * (2/3 - t ) * 6 if t < 2/3
        
    byteToHex=( n )->
        nybHexString = "0123456789ABCDEF";
        "#{nybHexString.substr( ( n >> 4 ) & 0x0F , 1 ) + nybHexString.substr(n & 0x0F,1) }"  
        
    ###
        convert 3 hex values to 3 rgb values
    ###
    @hexToRgb: ()->
        Array.cast( arguments ).flatten().map (v)-> parseInt( v, 16 )
        
    ###
        convert 3 hex values to 3 hsl values
    ###
    @hexToHsl: ()->
        Color.rgbToHsl( Color.hexToRgb.apply( @, arguments ) )

    ###
        convert 3 rgb values to 3 hex values
    ###        
    @rgbToHex: ()->
        [r,g,b] = Array.cast( arguments ).flatten()
        [ byteToHex(r), byteToHex(g), byteToHex(b) ]
    
    ###
        convert 3 rgb values to 3 hsl values
    ###
    @rgbToHsl: ()->
        [ r, g, b ]= Array.cast( arguments ).flatten()
        r /= 255
        g /= 255
        b /= 255
        max = Math.max( r, g, b ) 
        min = Math.min( r, g, b ) 
        l   = ( max+min ) / 2
        if max is min
            h = s = 0 
        else
            d = max - min
            s = if l > 0.5 then d / ( 2 - max - min ) else d / ( max + min )
            switch max
                when r then h = ( g - b ) / d + ( if g < b then 6 else 0 )
                when g then h = ( b - r ) / d + 2
                when b then h = ( r - g ) / d + 4
            h /= 6
        [ h, s, l ]  
          
    ###
        convert 3 hsl values to 3 rgb values        
    ###
    @hslToRgb: ()->
        [ h, s, l ] = Array.cast( arguments ).flatten()
        if s is 0
            r = g = b = l
        else
            q = if l < 0.5 then l * ( 1 + s ) else l + s - l * s
            p = 2 * l - q;
            r = hueToRgb(p, q, h + 1/3)
            g = hueToRgb(p, q, h )
            b = hueToRgb(p, q, h - 1/3)
            [ r*255, g*255, b*255 ]

    ###
        convert 2 hsl values to 3 hex values
    ###
    @hslToHex: ()->
        Color.rgbToHex( Color.hslToRgb.apply( @, arguments ) )
    constructor: ( stringColor )->
        @rgb   = []
        @hsl   = []
        @hex   = []
        if /rgb/.test( stringColor )
            @rgb = (/(\d+)\s?\,\s?(\d+)\s?\,\s?(\d+)/gm).exec( stringColor ).slice( 1 )
        else if /hsl/.test( stringColor )
            @hsl = (/(\d+)\s?\,\s?(\d+)\s?\,\s?(\d+)/gm).exec( stringColor ).slice( 1 )
        else
            values = if /^\#/.test stringColor then stringColor.substr( 1 ) else stringColor
            if values.length is 3
                @hex = values.split('').reduce (p,n)-> 
                    p.push( "#{n}#{n}" )
                , []
            else
                @hex    = /(\w{2})(\w{2})(\w{2})/.exec(values).slice(1)
        # at this point, we have at least one collection of values for conversions...
        if @rgb.length is 0 and  @hsl.length is 0 
            @rbg = Color.hexToRgb( @hex )
            @hsl = Color.hexToHsl( @hex )
        else if @rgb.length > 0
            @hsl = Color.rgbToHsl( @rgb )
            @hex = Color.rgbToHex( @rgb )
        else if @hsl.length > 0
            @rgb = Color.hslToRgb( @hsl ) 
            @hex = Color.hslToHex( @hsl )
        return @
    toPolar:     (w,h)->
        xy = @toXY(w,h)
        M.cartesianToPolar( xy )
    toRGBString: ()-> 
        rgb = @rgb.map M.round
        "rgb(#{rgb[0]},#{rgb[1]},#{rgb[2]})"
    toHSLString: ()-> 
        hsl = @hsl.map (c)-> c.toString().substr(0,4)
        "hsl(#{hsl[0]},#{hsl[1]},#{hsl[2]})"
    toHexString: ()-> "##{@hex[0]}#{@hex[1]}#{@hex[2]}"    
    toString: ()-> @toHexString()
###
    A base Plane class, to map out some dots.
###
class Plane        
    constructor: (options)->
        options.type   ||= 'cartesian'
        @image  = document.getElementById("#{options.type}-colors")
        @gray   = document.getElementById("gray-colors")
        options.width  ||= @image.width
        options.height ||= @image.height
        @type   = options.type
        @width  = options.width
        @height = options.height
        @container      = if typeof options.containerID isnt "undefined" then document.getElementById(options.containerID) else document.body
        @canvas         = document.createElement('canvas')
        @context        = @canvas.getContext('2d')
        @canvas.width   = @width+10
        @canvas.height  = @height
        @context.drawImage( @image, 10, 0, @width, @height)
        @context.drawImage( @gray , 0,  0, 10, @height )
        @container.appendChild( @canvas )
        return @
    drawDot: (x,y,color)->
        [x,y,color] = Array.cast(arguments).flatten()
        @context.save()
        @context.shadowOffsetX = 0
        @context.shadowOffsetY = 0    
        @context.shadowBlur  = 1
        @context.shadowColor = "rgba(0, 0, 0, 0.5)"
        @context.fillStyle   = color  or '#ffffff'
        @context.lineWidth = 1.5
        @context.strokeStyle = '#ffffff'
        @context.moveTo x, y
        @context.beginPath()
        @context.arc x, y, 3, 0, M.PI2, true 
        @context.closePath()        
        @context.fill()
        @context.stroke()
        @context.restore()
    plotColor: ()->
        colors = Array.cast(arguments).flatten()
        colors.forEach ( color )->
            plot = @getColorPlotPoint(color)
            @drawDot plot[0], plot[1], color.toHexString(), '#ffffff'
        , @
###
    extends the base Plane to provide a cartesian plane
###                 
class CartesianPlane extends Plane
    getColorPlotPoint: (color)->   
            x = color.hsl[0]*@width
            y = @height-color.hsl[2]*@height
            return [x+10,y] if color.hsl[1] isnt 0 
            [
                5
                @height-color.hsl[2]*@height
            ]

###
    extends the base Plane to provide a polar plane
###                             
class PolarPlane extends CartesianPlane

ColorPlotter = 
    Color:          Color
    CartesianPlane: CartesianPlane
    PolarPlane:     PolarPlane
    createColor: ( string  )-> new Color( string )
    createPlane: ( options )-> 
        switch options.type
            when 'polar' then new PolarPlane( options )
            else new CartesianPlane( options )
    plotColors: ( options )->
        plane  = ColorPlotter.createPlane( options )
        colors = (options.color || options.colors || []).map (c)-> if typeof c is 'string' then new Color( c ) else c
        plane.plotColor( colors )
    ready: ( fn )->
        window.onload = ()->
            fn( ColorPlotter )
                    
if typeof exports is "undefined"
    exports = window
    exports.ColorPlotter = ColorPlotter
