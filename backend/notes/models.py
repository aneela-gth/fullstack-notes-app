from django.db import models

class Note(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    file = models.URLField()  # ✅ store Supabase public URL
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
