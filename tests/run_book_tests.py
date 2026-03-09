#!/usr/bin/env python3
"""
Run only the book CRUD unit tests.
This script focuses specifically on testing the book CRUD operations.
"""

import unittest
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from tests.test_book_crud import TestBookService, TestBookSchemas


def run_book_crud_tests():
    """Run only the book CRUD unit tests."""

    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add book CRUD test cases
    suite.addTests(loader.loadTestsFromTestCase(TestBookService))
    suite.addTests(loader.loadTestsFromTestCase(TestBookSchemas))

    print("Running Book CRUD Unit Tests...")
    print("=" * 50)

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Print summary
    print("\n" + "=" * 50)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")

    if result.wasSuccessful():
        print("✅ All book CRUD tests passed!")
        return 0
    else:
        print("❌ Some tests failed. See details above.")
        return 1


if __name__ == '__main__':
    exit_code = run_book_crud_tests()
    sys.exit(exit_code)