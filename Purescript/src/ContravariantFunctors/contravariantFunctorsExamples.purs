module Infamous where

import Prelude
import Data.Predicate
import Data.Functor.Contravariant(cmap)
import Data.Comparison (Comparison(..))

type Age = Int
type Person = { age :: Age }


fromPersonToAge :: Person -> Age
fromPersonToAge = _.age

-- Predicate
isMoreThanEighteen :: Predicate Age
isMoreThanEighteen = Predicate ((<) 18)

personIsMoreThanEighteen :: Predicate Person
-- (Person -> Age) -> (Predicate Age -> Predicate Person)
personIsMoreThanEighteen = cmap fromPersonToAge isMoreThanEighteen


-- Comparison
compareAge :: Comparison Age
compareAge = Comparison compare

comparePersonAge :: Comparison Person
comparePersonAge = cmap fromPersonToAge compareAge

runPredicate :: forall a. Predicate a -> a -> String
runPredicate (Predicate fa) a = show (fa a)
