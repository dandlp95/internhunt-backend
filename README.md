# internhunt-backend


## Issues fixed:

Lower and upper case matters when passing value query parameters to mongoose

Check one endpoint is not overriding another endpoint

Remember to use findOne, otherwise you will get an array if you only use find

Remember you cant use use setState function and then use that changed state inside the usestate, unless you put that state in the dependency array of useeffect. This is because useeffect is only triggerred in the very first rendered. So when you change the state, that wont be triggered until the next render. 

Think about it, if you do something like useState(), and then you try to use that state inside useeffect, undefined is the value you will have access to because that is the initial state. It doesn't matter if you change it with setstate, because set state will only exist outisde of useeffect in the second render. To fix this, you can add that state as part of the dependency array (the second argument of useeffect), that way, useeffect will run again with the new state. 

If you get error from the backend related to cors, perhaps you forgot to stringify the javascript object before sending it.
.