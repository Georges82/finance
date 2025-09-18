from locust import HttpUser, task, between

class APITest(HttpUser):
    wait_time = between(1, 5)  # Wait 1 to 5 seconds between requests

    @task
    def test_subscriptions(self):
        self.client.get("/subscriptions")

