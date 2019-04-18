package applicative
import scala.concurrent.{Future, Await}
import scala.concurrent.Future.{sequence, traverse}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration._
import cats.Applicative
import cats._
import cats.implicits._

object MainApp extends Solutions with App {
  // println(
  //   Await.result(
  //     Await.result(uglyFunctorSolution(), Duration(10, SECONDS)),
  //     Duration(10, SECONDS)
  //   )
  // )

  // println(Await.result(applicativeSolution1(), Duration(10, SECONDS)))
  // println(Await.result(betterApplicativeSolution(), Duration(10, SECONDS)))
  // println(Await.result(superSayanApplicativeSolution(), Duration(10, SECONDS)))
  // println(Await.result(composedApplicativeSolution(), Duration(10, SECONDS)))
  println(Await.result(nApplicativeSolution(), Duration(10, SECONDS)))
  println(Await.result(nApplicativeModifiedSolution(), Duration(10, SECONDS)))
}

trait Solutions {
  // problem: we have a function to compute how many dollars have in their bank account Ema and Zanza combined
  def computeTotalDollars = (x: Int) => (y: Int) => x + y
  def computeTotalDollarsUncurried = (x: Int, y: Int) => x + y

  // we read ema's and zanza's dollars from a db
  lazy val emaDollars = Future(42)
  lazy val zanzaDollars = Future(10)

  // we know that Future is a Functor so we can map
  def uglyFunctorSolution(): Future[Future[Int]] = {
    val r1 = emaDollars.map(computeTotalDollars)

    // woa this is orrible and impossible to understand...
    r1.map(f => zanzaDollars.map(f(_)))
  }

  // if only we where able to use a "lifted function" without defining an ugly unreadable ah hoc implementation...
  def applicativeSolution1(): Future[Int] = {
    Applicative[Future]
      .pure(computeTotalDollars)
      .ap(zanzaDollars)
      .ap(emaDollars)
  }

  def betterApplicativeSolution(): Future[Int] = {
    Applicative[Future].map2(emaDollars, zanzaDollars)(
      computeTotalDollarsUncurried
    )

    // (emaDollars, zanzaDollars).mapN(computeTotalDollarsUncurried)
  }

  // super fancy solution
  def superSayanApplicativeSolution(): Future[Int] = {
    (emaDollars |@| zanzaDollars).map(computeTotalDollarsUncurried)
  }

  // what if we have complicated nested Applicatives structures? They compose! (they are functors afterall...)
  // maybe you don't even need monad transformers!!
  def composedApplicativeSolution(): Future[Option[Int]] = {
    lazy val emaDollars = Future(Option(42))
    lazy val zanzaDollars = Future(Option(10))

    Applicative[Future]
      .compose[Option]
      .map2(emaDollars, zanzaDollars)(computeTotalDollarsUncurried)
  }

  // what if we don't know how many Applicative values we are going to have?
  def nApplicativeSolution(): Future[Int] = {
    lazy val fedeDollars = Future(1000000)
    lazy val gioDollars = Future(1)

    sequence(List(emaDollars, zanzaDollars, fedeDollars, gioDollars))
      .map(_.reduceLeft(computeTotalDollarsUncurried))
  }

  // what if we don't know how many Applicative values we are going to have AND we want to add a 10 dollar tip before adding them?
  def nApplicativeModifiedSolution(): Future[Int] = {
    lazy val fedeDollars = Future(1000000)
    lazy val gioDollars = Future(0)

    traverse(List(emaDollars, zanzaDollars, fedeDollars, gioDollars))(
      d => d.map(_ + 10)
    ).map(_.reduceLeft(computeTotalDollarsUncurried))
  }
}
