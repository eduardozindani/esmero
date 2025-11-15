/*

build structured context in paralel...

a. conversation history of back and forth messages, slice up to 8 total messages...

b. more than 8 messages we create summary (long term). to do so, we will group batches of 8 total messages, summarise each batch in parallel and then summarise all batches together.

therefore, we have always full conversation history without needing to reset... 
Returning the structured string with perfect context

<Short term history>
user[time]: x
agent[time]: x
current user message: x
<Short term history>

<Long term history>
summarised long term history...
<Long term history>

*/
