// https://github.com/buildo/react-container#notes-about-caching-query-values-in-a-container-instance
// typical usage
//
// container(MyComponent, {
//   queries: ['sortedData'],
//   reduceQueryProps: cacheQueryValues
//   // ...
// });

// The "signature"
//
// reduceQueryProps: (accumulator: Any, propsFromQueries: PropsFromQueries) => ({
//   accumulator: Any, // accumulator for the next re-render, if needed
//   props: PropsFromQueries // the actual props passed down at this render: you can map/change `readyState` and any query as you wish here
// });

// ---------------------
// using a Monoid instead...

// let's start from a single query
// QueryProp ADT

type Loading = { type: 'loading' };
type Failure<L> = { type: 'failure'; error: L };
type Success<A> = { type: 'success'; value: A };
type QueryProp<L, A> = Loading | Failure<L> | Success<A>;

// ADT helpers (btw all of this can be generated using fp-ts-codegen)

const loading: QueryProp<never, never> = { type: 'loading' };
function failure<L, A>(error: L): QueryProp<L, A> {
  return { type: 'failure', error };
}
function success<L, A>(value: A): QueryProp<L, A> {
  return { type: 'success', value };
}
function matchQueryProp<L, A, R>(
  q: QueryProp<L, A>,
  ifLoading: R,
  ifFailure: (error: L) => R,
  ifSuccess: (value: A) => R
): R {
  switch (q.type) {
    case 'loading':
      return ifLoading;
    case 'failure':
      return ifFailure(q.error);
    case 'success':
      return ifSuccess(q.value);
  }
}

// a first attempt:

import { Monoid, getJoinMonoid, fold } from 'fp-ts/lib/Monoid';

const dummyQueryPropMonoid: Monoid<QueryProp<unknown, unknown>> = {
  empty: loading,
  concat: (_, y) =>
    matchQueryProp<unknown, unknown, QueryProp<unknown, unknown>>(y, loading, failure, success)
};

// not really usable...

dummyQueryPropMonoid.concat(loading, success(1)); // : QueryProp<unknown, unknown> :(

// a more general solution (still, arbitrary. Will it always be?)

function getQueryPropMonoid<L, A>(MF: Monoid<L>, MS: Monoid<A>): Monoid<QueryProp<L, A>> {
  return {
    empty: loading,
    concat: (x, y) =>
      matchQueryProp<L, A, QueryProp<L, A>>(
        y,
        loading,
        e2 => failure(matchQueryProp(x, e2, e1 => MF.concat(e1, e2), () => e2)),
        s2 => success(matchQueryProp(x, s2, () => s2, s1 => MS.concat(s1, s2)))
      )
  };
}

import { getArrayMonoid, getMeetMonoid } from 'fp-ts/lib/Monoid';
import { boundedNumber } from 'fp-ts/lib/Bounded';

const ML = getArrayMonoid<string>();
const MS = getMeetMonoid(boundedNumber); // MIN, empty: +Infinity
const queryPropMonoid: Monoid<QueryProp<Array<string>, number>> = getQueryPropMonoid(ML, MS);
queryPropMonoid.concat(failure(['failed']), success(1)); // QueryProp<string[], number> :)

// ---------------------
// a practical example: let's recreate `cacheQueryValues`: esercizio lasciato al lettore

const cacheQueryValuesMonoid: Monoid<QueryProp<string, Array<string>>> = {
  empty: loading,
  concat: (x, y) =>
    matchQueryProp<string, Array<string>, QueryProp<string, Array<string>>>(
      y,
      matchQueryProp<string, Array<string>, QueryProp<string, Array<string>>>(
        x,
        loading,
        failure,
        success
      ),
      failure,
      success
    )
};

// ---------------------
// a practical example: accumulating paginated users

type User = string; // just an example
type PaginatedUsersSuccess = { page: number; users: Array<User> };
type PaginatedUsersFailure = string; // just an example

import { getStructMonoid } from 'fp-ts/lib/Monoid';

const paginatedUsersSuccessMonoid: Monoid<PaginatedUsersSuccess> = getStructMonoid({
  page: getJoinMonoid(boundedNumber), // representing the last page fetched (:/)
  users: getArrayMonoid<User>() // what about sorting?
});

import { monoidString } from 'fp-ts/lib/Monoid';

const monoidPaginatedUsers: Monoid<
  QueryProp<PaginatedUsersFailure, PaginatedUsersSuccess>
> = getQueryPropMonoid(monoidString /* just an example */, paginatedUsersSuccessMonoid);

// ---------------------
// reusing the same Monoid definition outside of `reduceQueryProps` (1)
// assume we have an Array<QueryProp<PaginatedUsersFailure, PaginatedUsersSuccess>>

declare const listOfPaginatedUsersResults: Array<
  QueryProp<PaginatedUsersFailure, PaginatedUsersSuccess>
>;

// obtain the data ready to be shown in a UI:

fold(monoidPaginatedUsers)(listOfPaginatedUsersResults); // QueryProp<_, PaginatedUsersSuccess>

// ---------------------
// reusing the same Monoid definition outside of `reduceQueryProps` (2)
// assume we have an Map<QueryProp<PaginatedUsersFailure, PaginatedUsersSuccess>>
// (e.g.: from an avenger cache)

declare const mapOfPaginatedUsersResults: Map<
  string,
  QueryProp<PaginatedUsersFailure, PaginatedUsersSuccess>
>;

// TODO

// ---------------------
// appendix: now that we have a Monoid for a single query prop, how do we get one for the complete declaration?

const queryPropsMonoid = getStructMonoid({
  query1: queryPropMonoid
  // ...
});
// ->
// Monoid<{
//     query1: QueryProp<string[], number>;
// }>