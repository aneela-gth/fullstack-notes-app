from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.http import HttpResponseRedirect

from .models import Note
from .serializers import NoteSerializer


class NoteListCreate(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def get_permissions(self):
        # 👑 Only admin can upload
        if self.request.method == "POST":
            return [IsAdminUser()]
        # 👤 Anyone can view
        return [AllowAny()]

    def get(self, request):
        search = request.GET.get("search", "")
        notes = Note.objects.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search)
        ).order_by("-uploaded_at")

        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = NoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NoteDetail(APIView):
    permission_classes = [IsAdminUser]  # 👑 only admin can delete

    def delete(self, request, pk):
        note = get_object_or_404(Note, pk=pk)
        note.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def download_note(request, pk):
    """
    Supabase files are public URLs.
    Just redirect the user to the file.
    """
    note = get_object_or_404(Note, pk=pk)
    return HttpResponseRedirect(note.file)
