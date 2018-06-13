# Gosh: Great Object Storage, Hooray!

Do you ever want to be able to stash JavaScript objects somewhere and then find them again later?

Gosh offers a simple interface for storing and finding objects again. 

Let's start with an example for storing information about people. Treating people like objects is not generally OK, OK? But in this case we'll make an exception.

First, import the `DocumentStore` and define a new store type, with a key based on the value of each object's `id` property:

    const { DocumentStore } = require('gosh')
    const PeopleStore = DocumentStore.define('id')

Now, create an instance of the store and put some objects into it:

    const people = new PeopleStore()
    await people.put(
      { id: 1, name: "Dave" },
      { id: 2, name: "Sue" }
    )

Now retrieve one of them based on a query:

    console.log(await people.get({ id: 1 })
    > { id: 1, name: 'Dave' }

## Updates

The reason for having a unique key on your store is so that Gosh knows when to update rather than insert documents when you `put` them into the store:

    await people.put(
      { id: 1, name: "Dave" },
    )
    # ... time passes
    await people.put(
      { id: 1, name: "David" }
    )
    console.log(await people.get({ id: 1 })
    > { id: 1, name: 'David' }

## Multiple indices

Suppose you want to fetch people out by another attribute. Let's define out store with another index on it:

    const PeopleStore = DocumentStore.define('id', 'name')

Now we can find all the people named Dave:

    const daves = await people.all({ name: 'Dave' })

There might only be one of course. Gosh doesn't mind.

## Deletes

You can delete things of course, using a query:

    await people.delete({ name: 'Dave' })

Any objects matching that query will be deleted from the store.

## Normalising attributes

Suppose we want a case-insensitive search for a person's name. We need to normalise the data on the index by using a function instead of just the name of the attribute:

    const PeopleStore = DocumentStore.define('id', person => person.name.downcase())
    await people.put(
      { id: 1, name: "Dave" },
    )
    console.log(await people.get({ name: 'dave' })
    > { id: 1, name: 'Dave' }

## Many-to-many indices

Now, fancy-pants, maybe you have nested data that matters to you for indexing and querying.

Imagine each person has some animals. Take Dave for example: it turns out he's got a small farm:

    const dave = { id: 1, name: "Dave", animals: [{ breed: "goat" }, { breed: "chicken" }] }

Sue also keeps chickens, but more as a hobby:

    const sue = { id: 2, name: "Sue", animals: [{ breed: "chicken" }] }

We want to be able to query for all the people with a particular animal, so we set up a many-many index like this:

    const PeopleStore = DocumentStore.define(
      'id',
      [person => person.animals.map(animal => animal.breed)]
    )

By passing the index definition as an array, we tell Gosh that this is for many-to-many queries.

Now we can query for all the people who have chickens, for example:

    const people = new PeopleStore()
    await people.put(dave, sue)
    console.log(await people.all({ animals: [{ breed: 'chicken' }] }))

## Read-only interface

Perhaps you like to keep commands and queries separate in your application. Good idea!

You can ask a `DocumentStore` to give you a read-only inteface that only has the query methods on it.

    const readOnlyPeople = people.forQueries()
    await readOnlyPeople.get({ id: 1 })

## Events

The `DocumentStore` emits events when things change, in case you want to be able to act on them.

    const PeopleStore = DocumentStore.define('id')
    const people = new PeopleStore()
    people.events.on('change', ({ from, to }) => {
      console.log('from: ', from, ' to: ', to)
    })
    await people.put({ id: 1, name: "Dave" {)
    > from [null] to { id: 1, name: "Dave" })

## What else?

That's about it, to be honest. If you can think of new behaviour that ould be useful, submit a ticket and we can talk about it there.

