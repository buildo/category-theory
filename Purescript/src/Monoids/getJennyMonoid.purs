module TriggerMonoid where

import Prelude

data Trigger = Trigger { analyzer :: String }

instance showFile :: Show Trigger where
  show (Trigger a) = show a

instance triggerSemigroup :: Semigroup Trigger where
  append (Trigger { analyzer: ""}) b = b
  append a (Trigger { analyzer: ""}) = a
  append (Trigger a) (Trigger b) = Trigger { analyzer: ("max(" <> a.analyzer <> "," <> b.analyzer <> ")") }

instance triggerMonoid :: Monoid Trigger where
  mempty = Trigger {analyzer: ""}

a :: Trigger
a = Trigger {analyzer: "keywords()"}

b :: Trigger
b = Trigger {analyzer: "keywords(culo, tette)"}

-- show (append a b)
-- show (append (guard true a) b)


-- it's not a functor!!
-- instance triggerFunctor :: Functor Trigger where
--   map f (Trigger a) =  f a

-- branch :: Functor f => f (Either a b) -> f (a -> c) -> f (b -> c) -> f c
-- branch x l r = fmap (fmap Left) x <*? fmap (fmap Right) l <*? r

-- b :: Functor (Either Int String)
-- b = Maybe Right 1

-- c = map (map Left) a
-- d = map (map Left) b

-- q :: Maybe (Either String String)
-- q = Just (Left "a")

-- t :: Maybe (Either String String)
-- t = Just (Right "a")

-- l :: String -> String
-- l _ = "b"

-- w :: String
-- w =  map (map Left) l

-- r :: String
-- r =  map (map Left) t
