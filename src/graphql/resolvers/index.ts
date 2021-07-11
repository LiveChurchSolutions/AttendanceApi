import scalarCustom from './ScalarCustomResolver'

export default [
  scalarCustom,
  {
    Query: {
      test: () => 'Hello'
    },
    Mutation: {
      create: () => 'Create'
    }
  }
];