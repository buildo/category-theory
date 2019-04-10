module ListOfTuplesExercice where

import Prelude

import Control.Alternative (class Alternative, empty)
import Data.Array.Partial (head)
import Data.Either (Either(..))
import Data.Foldable (find, foldl)
import Data.Functor (class Functor, ($>))
import Data.Generic.Rep (class Generic)
import Data.Generic.Rep.Eq (genericEq)
import Data.Generic.Rep.Show (genericShow)
import Data.List (filter, nub, sortBy)
import Data.List.Types (List(..), NonEmptyList(..), (:))
import Data.Maybe (Maybe(..), isJust)
import Data.Monoid (guard)
import Data.NonEmpty (NonEmpty(..), (:|))
import Data.Tuple (Tuple(..))
import Partial.Unsafe (unsafePartial)

data IntTuple = IntTuple (Tuple Int Int)

data SanitizedList = SanitizedList (List IntTuple)

derive instance genericTupleInt :: Generic IntTuple _

derive instance genericSanitizedTupleInt :: Generic SanitizedList _

instance sanitizedTupleIntShow :: Show SanitizedList where
  show = genericShow

instance tupleIntShow :: Show IntTuple where
  show = genericShow

instance tupleIntEq :: Eq IntTuple where
  eq = genericEq

overlap :: Int -> Int -> Int -> Int -> Boolean
overlap a b c d = (c < b && d > a) || (d > a && c < b)

instance tupleInt :: Semigroup IntTuple where
  append (IntTuple (Tuple a b)) (IntTuple (Tuple c d)) =
    if (overlap a b c d)
      then IntTuple $ Tuple (min a c) (max b d)
      else IntTuple $ Tuple a b

sanitizeTupleList' :: List IntTuple -> List IntTuple
sanitizeTupleList' Nil = Nil
sanitizeTupleList' (x:xs) = nub (getAggregateValue x xs : sanitizeTupleList' xs)
  where
    getAggregateValue :: IntTuple -> List IntTuple -> IntTuple
    getAggregateValue tuple = foldl (\t1 -> \t2 -> append t1 t2) tuple

sanitizeTupleList :: List IntTuple -> SanitizedList
sanitizeTupleList = removeOverlapping <<< nub <<< sanitizeTupleList' where
  removeOverlapping :: List IntTuple -> SanitizedList
  removeOverlapping Nil = SanitizedList Nil
  removeOverlapping l = SanitizedList $ filter (not $ isContained l) l
  isContained :: List IntTuple -> IntTuple -> Boolean
  isContained l' (IntTuple (Tuple a b)) = isJust $ find (\(IntTuple (Tuple c d)) -> ((a > c && b <= d) || (a >= c && b < d))) l'


tuplelist :: List IntTuple
tuplelist = (IntTuple (Tuple 6 9) : IntTuple (Tuple 11 23) : IntTuple (Tuple 13 28) : IntTuple (Tuple 7 10) : IntTuple (Tuple 1 2) : IntTuple (Tuple 6 9) : IntTuple (Tuple 27 210) : Nil)


