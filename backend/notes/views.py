from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.http import HttpResponseRedirect

from .models import Note
from .serializers import NoteSerializer

class NoteListCreate(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        notes = Note.objects.all().order_by("-uploaded_at")
        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = NoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)




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
